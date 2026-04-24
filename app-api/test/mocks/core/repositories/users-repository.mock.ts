import { MockQueryBuilder } from 'test/query-builder.mock';
import { USERS_MOCK } from '../entities/users.mock';
import { USER_AUTH_PROVIDERS_MOCK } from
    '../entities/user-auth-providers.mock';
import { UsersRepository } from
    '@hms-module/modules/users/repositories/users.repository';
import { UserAuthProvider } from
    '@hms-module/modules/users/entities/user-auth-provider.entity';
import { User } from
    '@hms-module/modules/users/entities/user.entity';

/**
 * Generate a UUID v4. Uses crypto.randomUUID when available (Node 20+),
 * otherwise falls back to a simple RFC4122-ish polyfill good enough for tests.
 */
function uuid(): string {
    const g = (globalThis as any);
    if (g?.crypto?.randomUUID) return g.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
        .replace(/[xy]/g, (c: string) => {
            const r = (Math.random() * 16) | 0;
            const v = c === 'x' ? r : (r & 0x3) | 0x8;
            return v.toString(16);
        });
}

/**
 * Ensure we always return a real class instance for User.
 */
function toClassUser(src: Partial<User>): User {
    // Avoid spreading class instances into POJOs. Assign onto a new User().
    const u = Object.assign(new User(), src);

    // Normalize must-have fields and defaults to avoid undefined pitfalls.
    u.auth_providers = Array.isArray(u.auth_providers) ? u.auth_providers : [];
    u.twoFactorMethods = Array.isArray(u.twoFactorMethods)
        ? u.twoFactorMethods
        : [];

    // Ensure nullable fields are explicit where needed.
    if (u.admin_id === undefined) u.admin_id = null;
    if (u.admin === undefined) u.admin = null;

    return u;
}

/**
 * Ensure we always return a real class instance for UserAuthProvider.
 */
function toClassAuthProvider(
    src: Partial<UserAuthProvider>,
): UserAuthProvider {
    const ap = Object.assign(new UserAuthProvider(), src);
    if (ap.user === undefined) ap.user = null;
    return ap;
}

/**
 * Ensures all users/authProviders have string UUIDs and are class instances.
 * If provided as numbers, converts them and preserves relationships.
 */
function normalizeInitialData(
    initialUsers: User[],
    initialAuthProviders: UserAuthProvider[],
): { users: User[]; authProviders: UserAuthProvider[] } {
    const idMap = new Map<string | number, string>();

    // 1) Normalize users -> UUID ids and materialize class instances
    const users = initialUsers.map((u) => {
        const newId =
            typeof u.id === 'string' && u.id.length > 0 ? u.id : uuid();
        idMap.set(u.id as any, newId);

        return toClassUser({
            ...u,
            id: newId,
            admin_id:
                typeof u.admin_id === 'string' || u.admin_id == null
                    ? u.admin_id ?? null
                    : String(u.admin_id),
            // relations will be linked below
            auth_providers: Array.isArray(u.auth_providers)
                ? u.auth_providers
                : [],
        });
    });

    // 2) Normalize auth providers -> UUID ids and user_id as UUID string
    const authProviders = initialAuthProviders.map((ap) => {
        const newApId =
            typeof ap.id === 'string' && ap.id.length > 0 ? ap.id : uuid();
        const mappedUserId =
            idMap.get(ap.user_id as any) ??
            (typeof ap.user_id === 'string' ? ap.user_id : uuid());

        return toClassAuthProvider({
            ...ap,
            id: newApId,
            user_id: mappedUserId as string,
            user: null, // link later
        });
    });

    // 3) Link relations (without breaking class instances)
    const usersById = new Map<string, User>(users.map((u) => [u.id, u]));

    // Build map user_id -> authProviders
    const authByUser = new Map<string, UserAuthProvider[]>();
    for (const ap of authProviders) {
        const list = authByUser.get(ap.user_id) ?? [];
        list.push(ap);
        authByUser.set(ap.user_id, list);
    }

    // Attach arrays to user instances
    for (const u of users) {
        u.auth_providers = authByUser.get(u.id) ?? [];
    }

    // Link back user on each provider
    for (const ap of authProviders) {
        ap.user = usersById.get(ap.user_id) ?? null;
    }

    return { users, authProviders };
}

interface CustomUsersRepository extends UsersRepository {
    createAuthProvider(
        userId: string,
        provider: string,
        data: any,
    ): Promise<UserAuthProvider>;

    findAuthProvider(
        userId: string,
        provider: string,
    ): Promise<UserAuthProvider | undefined>;
}

interface MockEntityManager {
    save: jest.Mock;
}

interface MockManager {
    transaction: jest.Mock;
    save: jest.Mock;
    [key: string]: jest.Mock;
}

export type MockUserRepository =
    Partial<Record<keyof CustomUsersRepository, jest.Mock>> & {
        mockQueryBuilderInstance?: MockQueryBuilder;
        manager: jest.Mock & MockManager;
    };

export const createMockUserRepository = (
    initialUsers: User[] = USERS_MOCK,
    initialAuthProviders: UserAuthProvider[] = USER_AUTH_PROVIDERS_MOCK,
): MockUserRepository => {
    // Normalize to UUID strings, link relations, and keep class instances
    const normalized = normalizeInitialData(
        initialUsers,
        initialAuthProviders,
    );

    let currentUsers: User[] = [...normalized.users];
    let currentAuthProviders: UserAuthProvider[] = [
        ...normalized.authProviders,
    ];

    const mockQueryBuilder: MockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockImplementation(() =>
            Promise.resolve(currentUsers[0] ?? null),
        ),
        getMany: jest.fn().mockImplementation(() =>
            Promise.resolve(currentUsers),
        ),
    };

    // Create mock manager with proper typing
    const baseManager: MockManager = {
        transaction: jest.fn().mockImplementation(async (callback) => {
            const mockEntityManager: MockEntityManager = {
                save: jest.fn().mockImplementation((entity: any) => {
                    // Persist User
                    if (entity && (entity as User).email) {
                        const uIn = entity as User;
                        const id =
                            uIn.id && typeof uIn.id === 'string' ? uIn.id : uuid();

                        const existingIndex = currentUsers.findIndex(
                            (x) => x.id === id,
                        );

                        const toSave = toClassUser({
                            ...uIn,
                            id,
                            updated_at: new Date(),
                            created_at:
                                uIn.created_at ?? currentUsers[existingIndex]?.created_at
                                ?? new Date(),
                        });

                        if (existingIndex !== -1) {
                            currentUsers[existingIndex] = toSave;
                        } else {
                            currentUsers.push(toSave);
                        }
                        return Promise.resolve(toSave);
                    }

                    // Persist UserAuthProvider
                    if (entity && (entity as UserAuthProvider).provider) {
                        const apIn = entity as UserAuthProvider;
                        const id =
                            apIn.id && typeof apIn.id === 'string' ? apIn.id : uuid();
                        const user_id =
                            typeof apIn.user_id === 'string' ? apIn.user_id : uuid();

                        const toSave = toClassAuthProvider({
                            ...apIn,
                            id,
                            user_id,
                            updated_at: new Date(),
                            created_at: apIn.created_at ?? new Date(),
                            user:
                                currentUsers.find((u) => u.id === user_id)
                                ?? apIn.user
                                ?? null,
                        });

                        const existingIndex = currentAuthProviders.findIndex(
                            (x) => x.id === id,
                        );
                        if (existingIndex !== -1) {
                            currentAuthProviders[existingIndex] = toSave;
                        } else {
                            currentAuthProviders.push(toSave);
                        }
                        return Promise.resolve(toSave);
                    }

                    return Promise.resolve(entity);
                }),
            };
            return await callback(mockEntityManager);
        }),

        save: jest.fn().mockImplementation((entity: any) => {
            // Save User
            if (entity && (entity as User).email) {
                const uIn = entity as User;
                const id =
                    uIn.id && typeof uIn.id === 'string' ? uIn.id : uuid();

                const existingIndex = currentUsers.findIndex(
                    (x) => x.id === id,
                );

                const toSave = toClassUser({
                    ...uIn,
                    id,
                    updated_at: new Date(),
                    created_at:
                        uIn.created_at ?? currentUsers[existingIndex]?.created_at
                        ?? new Date(),
                });

                if (existingIndex !== -1) {
                    currentUsers[existingIndex] = toSave;
                } else {
                    currentUsers.push(toSave);
                }
                return Promise.resolve(toSave);
            }

            // Save UserAuthProvider
            if (entity && (entity as UserAuthProvider).provider) {
                const apIn = entity as UserAuthProvider;
                const id =
                    apIn.id && typeof apIn.id === 'string' ? apIn.id : uuid();
                const user_id =
                    typeof apIn.user_id === 'string' ? apIn.user_id : uuid();

                const toSave = toClassAuthProvider({
                    ...apIn,
                    id,
                    user_id,
                    updated_at: new Date(),
                    created_at: apIn.created_at ?? new Date(),
                    user:
                        currentUsers.find((u) => u.id === user_id)
                        ?? apIn.user
                        ?? null,
                });

                const existingIndex = currentAuthProviders.findIndex(
                    (x) => x.id === id,
                );
                if (existingIndex !== -1) {
                    currentAuthProviders[existingIndex] = toSave;
                } else {
                    currentAuthProviders.push(toSave);
                }
                return Promise.resolve(toSave);
            }

            return Promise.resolve(entity);
        }),
    };

    // Turn into a jest.fn() so it satisfies Mock<any, any, any>
    const mockManager = Object.assign(jest.fn(), baseManager);

    const userRepositoryMock: MockUserRepository = {
        createQueryBuilder: jest.fn().mockImplementation(() => {
            let filteredUsers = [...currentUsers];

            mockQueryBuilder.where.mockImplementation((condition, params) => {
                if (condition.includes('email = :email')) {
                    filteredUsers = filteredUsers.filter(
                        (user) => user.email === params.email,
                    );
                } else if (condition.includes('username = :username')) {
                    filteredUsers = filteredUsers.filter(
                        (user) => user.username === params.username,
                    );
                }
                return mockQueryBuilder;
            });

            mockQueryBuilder.andWhere.mockImplementation(
                (condition, params) => {
                    if (
                        condition.includes('two_factor_enabled = :twoFactorEnabled')
                    ) {
                        filteredUsers = filteredUsers.filter(
                            (user) =>
                                user.two_factor_enabled === params.twoFactorEnabled,
                        );
                    }
                    return mockQueryBuilder;
                },
            );

            mockQueryBuilder.leftJoinAndSelect.mockImplementation((relation) => {
                if (relation === 'auth_providers') {
                    // Keep class instances: reconstruct user with updated providers
                    filteredUsers = filteredUsers.map((user) =>
                        toClassUser({
                            ...user,
                            auth_providers: currentAuthProviders.filter(
                                (ap) => ap.user_id === user.id,
                            ),
                        }),
                    );
                }
                return mockQueryBuilder;
            });

            mockQueryBuilder.getOne.mockImplementation(() =>
                Promise.resolve(filteredUsers[0] ?? null),
            );

            mockQueryBuilder.getMany.mockImplementation(() =>
                Promise.resolve(filteredUsers),
            );

            return mockQueryBuilder;
        }),

        findById: jest.fn().mockImplementation((id: string) =>
            Promise.resolve(currentUsers.find((user) => user.id === id)),
        ),

        findByEmail: jest.fn().mockImplementation((email: string) =>
            Promise.resolve(currentUsers.find((u) => u.email === email)),
        ),

        findOne: jest.fn().mockImplementation((options: any) => {
            if (options?.where?.email) {
                return Promise.resolve(
                    currentUsers.find((u) => u.email === options.where.email),
                );
            }
            if (options?.where?.username) {
                return Promise.resolve(
                    currentUsers.find(
                        (u) => u.username === options.where.username,
                    ),
                );
            }
            if (options?.where?.id) {
                return Promise.resolve(
                    currentUsers.find((u) => u.id === options.where.id),
                );
            }
            return Promise.resolve(null);
        }),

        save: jest.fn().mockImplementation((user: User) => {
            const id = user.id && typeof user.id === 'string'
                ? user.id
                : uuid();

            const existingIndex = currentUsers.findIndex((u) => u.id === id);

            const toSave = toClassUser({
                ...user,
                id,
                updated_at: new Date(),
                created_at:
                    user.created_at ?? currentUsers[existingIndex]?.created_at
                    ?? new Date(),
            });

            if (existingIndex !== -1) {
                currentUsers[existingIndex] = toSave;
            } else {
                currentUsers.push(toSave);
            }
            return Promise.resolve(toSave);
        }),

        create: jest.fn().mockImplementation((userData: Partial<User>) => {
            if (!userData.email) {
                throw new Error('Email is required');
            }

            const now = new Date();
            const newUser = toClassUser({
                id: uuid(),
                email: userData.email,
                username: userData.username
                    ?? userData.email.split('@')[0],
                display_name: userData.display_name
                    ?? userData.email.split('@')[0],
                password: userData.password ?? null,
                email_verified: (userData as any)?.email_verified ?? false,
                two_factor_enabled: userData.two_factor_enabled ?? false,
                created_at: now,
                updated_at: now,
                auth_providers: [],
                admin_id: typeof userData.admin_id === 'string'
                    ? userData.admin_id
                    : null,
                admin: (userData as any)?.admin ?? null,
                twoFactorMethods:
                    (userData as any)?.twoFactorMethods ?? [],
            });

            currentUsers.push(newUser);
            return Promise.resolve(newUser);
        }),

        update: jest.fn().mockImplementation((criteria: any, partial: any) => {
            const user = currentUsers.find((u) => u.id === criteria.id);
            if (user) {
                const updated = toClassUser({
                    ...user,
                    ...partial,
                    updated_at: new Date(),
                });
                currentUsers = currentUsers.map((u) =>
                    u.id === user.id ? updated : u,
                );
                return Promise.resolve({ affected: 1 });
            }
            return Promise.resolve({ affected: 0 });
        }),

        createAuthProvider: jest.fn().mockImplementation((
            userId: string,
            provider: string,
            data: any,
        ) => {
            const now = new Date();
            const newAuthProvider = toClassAuthProvider({
                id: uuid(),
                user_id: userId,
                provider,
                data,
                created_at: now,
                updated_at: now,
                user: currentUsers.find((u) => u.id === userId) ?? null,
            });

            currentAuthProviders.push(newAuthProvider);

            // Keep the user's auth_providers array coherent
            const user = currentUsers.find((u) => u.id === userId);
            if (user) {
                user.auth_providers = [
                    ...(user.auth_providers ?? []),
                    newAuthProvider,
                ];
            }

            return Promise.resolve(newAuthProvider);
        }),

        findAuthProvider: jest.fn().mockImplementation((
            userId: string,
            provider: string,
        ) => {
            return Promise.resolve(
                currentAuthProviders.find(
                    (ap) => ap.user_id === userId && ap.provider === provider,
                ),
            );
        }),

        mockQueryBuilderInstance: mockQueryBuilder,
        manager: mockManager,
    };

    return userRepositoryMock;
};
