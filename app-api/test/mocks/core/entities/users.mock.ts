// users.mock.ts
import { User } from "@hms-module/modules/users/entities/user.entity";
// Evite importar USER_AUTH_PROVIDERS_MOCK aqui para não criar ciclo.
// Vamos exportar IDs e um helper para linkar depois no setup do teste.

export const USER_ID_1 = "11111111-1111-4111-8111-111111111111";
export const USER_ID_2 = "22222222-2222-4222-8222-222222222222";
export const USER_ID_3 = "33333333-3333-4333-8333-333333333333";

/**
 * Helper to build a real User instance (class) so methods exist on prototype.
 */
function makeUser(init: {
    id: string;
    email: string;
    username: string;
    display_name: string;
    password: string | null;
}): User {
    const now = new Date();

    const instance = Object.assign(new User(), {
        id: init.id,
        email: init.email,
        username: init.username,
        display_name: init.display_name,
        password: init.password,
        email_verified: false,
        two_factor_enabled: false,
        created_at: now,
        updated_at: now,
        // relations
        auth_providers: [] as any[],
        admin_id: null as string | null,
        admin: null,
        twoFactorMethods: [],
    });

    return instance;
}

/**
 * Export real instances so isAdminUser() is present.
 */
export const USERS_MOCK: User[] = [
    makeUser({
        id: USER_ID_1,
        email: "test@example.com",
        username: "testuser",
        display_name: "Test User",
        password: "hashedpassword",
    }),
    makeUser({
        id: USER_ID_2,
        email: "test2@example.com",
        username: "testuser2",
        display_name: "Test User 2",
        password: "hashedpassword2",
    }),
    makeUser({
        id: USER_ID_3,
        email: "test3@example.com",
        username: "testuser3",
        display_name: "Test User 3",
        password: "hashedpassword3",
    }),
];
