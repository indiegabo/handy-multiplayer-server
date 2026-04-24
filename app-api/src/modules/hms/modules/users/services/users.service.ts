import {
    Injectable,
    ConflictException,
    InternalServerErrorException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDTO } from '../dto/create-user.dto';
import { UsersRepository } from '../repositories/users.repository';
import { User } from '../entities/user.entity';
import { AdminUsersRepository } from
    '../repositories/admin-users.repository';
import { AdminUser } from '../entities/admin-user.entity';
import { BetterLogger } from
    '../../better-logger/better-logger.service';
import { UsernameAlreadyExistsException } from
    '../../auth/exceptions/username-already-exists.exception';
import { UserTwoFactorMethodsRepository } from
    '../repositories/user-two-factor-methods.repository';
import { TwoFactorMethod } from
    '../../auth/types/two-factor-method.type';
import { UserTwoFactorMethod } from
    '../entities/user-two-factor-method.entity';
import { AUTH_CONFIG } from '@src/config/hms/auth.config';

@Injectable()
export class UsersService {
    constructor(
        private readonly logger: BetterLogger,
        private readonly usersRepository: UsersRepository,
        private readonly adminUsersRepository: AdminUsersRepository,
        private readonly userTwoFactorMethodsRepository:
            UserTwoFactorMethodsRepository,
    ) {
        this.logger.setContext(UsersService.name);
    }

    /* ============================================================
     * ===============  ADMIN CREATION / OWNER CREATION  ==========
     * ============================================================
     */

    /**
     * Creates a new administrator with a hashed password.
     * If a transaction manager is provided, it will be used;
     * otherwise, an internal transaction is opened.
     *
     * @param input.email - Admin email (will be normalized).
     * @param input.name - Admin display name.
     * @param input.password - Plain password to be hashed.
     * @param manager - Optional. External transaction manager.
     *
     * @returns The created AdminUser entity.
     *
     * @throws {ConflictException}
     * If an admin with the same email already exists.
     *
     * @throws {InternalServerErrorException}
     * If creation fails for any reason.
     */
    async createAdmin(
        input: {
            email: string;
            name: string;
            password: string;
        },
        manager?: EntityManager
    ): Promise<AdminUser> {
        const email = input.email.trim().toLowerCase();

        const exists = await this.adminUsersRepository
            .findByEmail(email);
        if (exists) {
            throw new ConflictException('Email already in use');
        }

        const now = new Date();
        const saltRounds = AUTH_CONFIG.passwords.saltRounds;

        const exec = async (trx: EntityManager) => {
            const hashed = await bcrypt.hash(
                input.password,
                saltRounds
            );

            const admin = this.adminUsersRepository.create({
                email,
                name: input.name,
                password: hashed,
                is_owner: false,
                two_factor_enabled: true,
                created_at: now,
                updated_at: now,
                admin_permissions: {
                    all: false,
                    granted_at: now.toISOString(),
                },
            });

            return trx.save(admin);
        };

        try {
            if (manager) {
                return await exec(manager);
            }
            return await this.adminUsersRepository.manager
                .transaction(exec);
        } catch (error) {
            this.logger.error('Error creating admin user:', error);
            throw new InternalServerErrorException(
                'Failed to create administrator user'
            );
        }
    }

    /**
     * Creates the system owner (a special administrator) with a
     * hashed password. Only one owner is allowed.
     * If a transaction manager is provided, it will be used;
     * otherwise, an internal transaction is opened.
     *
     * @param input.email - Owner email (will be normalized).
     * @param input.name - Owner display name.
     * @param input.password - Plain password to be hashed.
     * @param manager - Optional. External transaction manager.
     *
     * @returns The created AdminUser entity with owner flags set.
     *
     * @throws {ConflictException}
     * If an owner already exists or email is already in use.
     *
     * @throws {InternalServerErrorException}
     * If creation fails for any reason.
     */
    async createOwner(
        input: {
            email: string;
            name: string;
            password: string;
        },
        manager?: EntityManager
    ): Promise<AdminUser> {
        const email = input.email.trim().toLowerCase();

        const existingOwner = await this.adminUsersRepository
            .findOne({ where: { is_owner: true } });
        if (existingOwner) {
            throw new ConflictException(
                'System owner already exists'
            );
        }

        const existingByEmail = await this.adminUsersRepository
            .findByEmail(email);
        if (existingByEmail) {
            throw new ConflictException('Email already in use');
        }

        const now = new Date();
        const saltRounds = AUTH_CONFIG.passwords.saltRounds;

        const exec = async (trx: EntityManager) => {
            const hashed = await bcrypt.hash(
                input.password,
                saltRounds
            );

            const admin = this.adminUsersRepository.create({
                email,
                name: input.name,
                password: hashed,
                is_owner: true,
                became_owner_at: now,
                two_factor_enabled: true,
                created_at: now,
                updated_at: now,
                admin_permissions: {
                    all: true,
                    granted_at: now.toISOString(),
                },
            });

            return trx.save(admin);
        };

        try {
            if (manager) {
                return await exec(manager);
            }
            return await this.adminUsersRepository.manager
                .transaction(exec);
        } catch (error) {
            this.logger.error('Error creating owner user:', error);
            throw new InternalServerErrorException(
                'Failed to create system owner'
            );
        }
    }

    /* ============================================================
     * =====================  END-USER CREATION  ==================
     * ============================================================
     */

    /**
     * Creates a new end-user with minimal fields.
     * Email uniqueness is enforced.
     *
     * @param createUserDto.email - User email to register.
     *
     * @returns The created User entity.
     *
     * @throws {ConflictException}
     * If a user with the same email already exists.
     */
    async createUser(
        createUserDto: CreateUserDTO
    ): Promise<User> {
        const { email } = createUserDto;

        const existingUser = await this.usersRepository
            .findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already exists');
        }

        return await this.usersRepository.manager
            .transaction(async (trx) => {
                const user = this.usersRepository.create({
                    email,
                });
                return trx.save(user);
            });
    }

    /* ============================================================
     * ======================  FIND / LOOKUP  =====================
     * ============================================================
     */

    /**
     * Finds an end-user by id.
     *
     * @param id - User id.
     * @returns A User or null if not found.
     */
    async findUserById(
        id: string
    ): Promise<User | null> {
        return this.usersRepository.findById(id);
    }

    /**
     * Finds an administrator by id.
     *
     * @param id - Admin id.
     * @returns An AdminUser or null if not found.
     */
    async findAdminById(
        id: string
    ): Promise<AdminUser | null> {
        return this.adminUsersRepository.findOneBy({ id });
    }

    /**
     * Finds an end-user by email.
     *
     * @param email - Email address (case-insensitive).
     * @returns A User or null if not found.
     */
    async findEndUserByEmail(
        email: string
    ): Promise<User | null> {
        return this.usersRepository.findByEmail(email);
    }

    /**
     * Finds an end-user by username.
     *
     * @param username - Username to search.
     * @returns A User or null if not found.
     */
    async findByUsername(
        username: string
    ): Promise<User | null> {
        return this.usersRepository.findByUsername(username);
    }

    /**
     * Finds an end-user by email or username.
     *
     * @param emailOrUsername - Email or username.
     * @returns A User or null if not found.
     */
    async findUserByEmailOrUsername(
        emailOrUsername: string
    ): Promise<User | null> {
        return this.usersRepository.findByEmailOrUsername(
            emailOrUsername
        );
    }

    /**
     * Finds an administrator by email.
     *
     * @param email - Email address (case-insensitive).
     * @returns An AdminUser or null if not found.
     */
    async findAdminByEmail(
        email: string
    ): Promise<AdminUser | null> {
        return this.adminUsersRepository.findByEmail(email);
    }

    /**
     * Finds the system owner admin (if any) and attaches
     * active 2FA methods to the returned entity.
     *
     * @returns The owner AdminUser or null if absent.
     */
    async findOwner(): Promise<AdminUser | null> {
        const owner = await this.adminUsersRepository.findOne({
            where: { is_owner: true },
        });

        if (!owner) return null;

        owner.twoFactorMethods =
            await this.userTwoFactorMethodsRepository.find({
                where: {
                    user_id: owner.id,
                    user_type: 'admin',
                },
            });

        return owner;
    }

    /**
     * Retrieves a user by type and id.
     *
     * @param userId - The user id.
     * @param userType - Either 'end_user' or 'admin'.
     *
     * @returns A User or AdminUser, or null if not found.
     */
    async getUserByType(
        userId: string,
        userType: 'end_user' | 'admin'
    ): Promise<User | AdminUser | null> {
        if (userType === 'admin') {
            return this.findAdminById(userId);
        }
        return this.findUserById(userId);
    }

    /* ============================================================
     * =====================  USERNAME / MISC  ====================
     * ============================================================
     */

    /**
     * Claims a unique username for a given end-user id.
     * Throws if the username is already taken.
     *
     * @param userId - End-user id.
     * @param username - Desired unique username.
     *
     * @throws {UsernameAlreadyExistsException}
     * If the username is already taken.
     */
    async claimUsername(
        userId: string,
        username: string
    ): Promise<void> {
        await this.usersRepository.manager
            .transaction(async (trx) => {
                const exists = await trx.findOne(User, {
                    where: { username },
                });

                if (exists) {
                    throw new UsernameAlreadyExistsException();
                }

                await trx.update(
                    User,
                    { id: userId },
                    { username }
                );
            });
    }

    /* ============================================================
     * ======================  2FA MANAGEMENT  ====================
     * ============================================================
     */

    /**
     * Lists all active 2FA methods for a given user id and type.
     *
     * @param userId - The user id.
     * @param userType - Either 'end_user' or 'admin'.
     *
     * @returns A list of active UserTwoFactorMethod.
     */
    async getUserActive2FAMethods(
        userId: string,
        userType: 'end_user' | 'admin'
    ): Promise<UserTwoFactorMethod[]> {
        return this.userTwoFactorMethodsRepository.find({
            where: {
                user_id: userId,
                user_type: userType,
                is_enabled: true,
            },
        });
    }

    /**
     * Finds a 2FA method for a given user and type.
     *
     * @param userId - The user id.
     * @param userType - Either 'end_user' or 'admin'.
     * @param method - The TwoFactorMethod to find.
     *
     * @returns A UserTwoFactorMethod or null if not found.
     */
    async getUser2FAMethod(
        userId: string,
        userType: 'end_user' | 'admin',
        method: TwoFactorMethod,
    ): Promise<UserTwoFactorMethod | null> {
        return this.userTwoFactorMethodsRepository.findOne({
            where: {
                user_id: userId,
                user_type: userType,
                method_type: method,
            },
        });
    }

    /**
     * Creates (but does not persist) a 2FA method object for a user.
     * Useful when composing an entity to be saved by a higher-level
     * transaction or service.
     *
     * @param userId - The user id.
     * @param userType - Either 'end_user' or 'admin'.
     * @param method - TwoFactorMethod type.
     * @param secretData - Optional secret data (e.g., TOTP secret).
     * @param metadata - Optional metadata object.
     *
     * @returns A new UserTwoFactorMethod entity (not saved).
     */
    async createUser2FAMethod(
        userId: string,
        userType: 'end_user' | 'admin',
        method: TwoFactorMethod,
        secretData?: string,
        metadata?: Record<string, any>
    ): Promise<UserTwoFactorMethod> {
        return this.userTwoFactorMethodsRepository.create({
            user_id: userId,
            user_type: userType,
            method_type: method,
            is_enabled: true,
            secret_data: secretData,
            metadata,
        });
    }

    /**
     * Finds a specific 2FA method by type.
     *
     * @param userId - The user id.
     * @param userType - Either 'end_user' or 'admin'.
     * @param methodType - The TwoFactorMethod to look up.
     *
     * @returns A UserTwoFactorMethod or null if not found.
     */
    async findUser2FAMethod(
        userId: string,
        userType: 'end_user' | 'admin',
        methodType: TwoFactorMethod
    ): Promise<UserTwoFactorMethod | null> {
        return this.userTwoFactorMethodsRepository.findOne({
            where: {
                user_id: userId,
                user_type: userType,
                method_type: methodType,
            },
        });
    }

    /**
     * Updates a 2FA method by id with partial data.
     *
     * @param methodId - The method id.
     * @param updateData - Partial fields to update.
     */
    async update2FAMethod(
        methodId: string,
        updateData: Partial<UserTwoFactorMethod>
    ): Promise<void> {
        await this.userTwoFactorMethodsRepository.update(
            methodId,
            updateData
        );
    }

    /* ============================================================
     * =====================  DANGEROUS / MAINT  ==================
     * ============================================================
     */

    /**
     * Deletes ALL administrator users.
     * Intended for maintenance or test environments.
     *
     * @returns True if deletion completed.
     *
     * @throws {InternalServerErrorException}
     * If deletion fails for any reason.
     */
    async deleteAllAdminUsers(): Promise<boolean> {
        try {
            return await this.adminUsersRepository.manager
                .transaction(async (trx) => {
                    await trx
                        .createQueryBuilder()
                        .delete()
                        .from(AdminUser)
                        .where('1 = 1')
                        .execute();
                    return true;
                });
        } catch (error) {
            this.logger.error('Error deleting all admin users:', error);
            throw new InternalServerErrorException(
                'Failed to delete admin users'
            );
        }
    }

    /**
     * Deletes ALL end-users.
     * Intended for maintenance or test environments.
     *
     * @returns True if deletion completed.
     *
     * @throws {InternalServerErrorException}
     * If deletion fails for any reason.
     */
    async deleteAllUsers(): Promise<boolean> {
        try {
            return await this.usersRepository.manager
                .transaction(async (trx) => {
                    await trx
                        .createQueryBuilder()
                        .delete()
                        .from(User)
                        .where('1 = 1')
                        .execute();
                    return true;
                });
        } catch (error) {
            this.logger.error('Error deleting users:', error);
            throw new InternalServerErrorException(
                'Failed to delete users'
            );
        }
    }
}
