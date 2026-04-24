import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { TwoFactorMethod } from '../../auth/types/two-factor-method.type';
import { UserType } from "@hms/shared-types/hms";

/**
 * Polymorphic 2FA method bound to either:
 * - end user (hms_users), or
 * - admin user (hms_admin_users).
 *
 * It uses (user_type, user_id) pair and keeps optional ORM
 * relations WITHOUT DB-level foreign keys to avoid conflicts.
 */
@Entity('hms_user_two_factor_methods')
@Index(
    'IDX_hms_u2fm_user_type_id',
    ['user_type', 'user_id'],
)
@Index(
    'IDX_hms_u2fm_is_primary',
    ['is_primary'],
)
export class UserTwoFactorMethod {
    /**
     * Primary key (UUID v4).
     */
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Polymorphic target ID (UUID).
     * Use with user_type to resolve to User or AdminUser.
     */
    @Column({
        type: 'uuid',
        name: 'user_id',
    })
    user_id!: string;

    /**
     * Owner type discriminator.
     */
    @Column({
        type: 'enum',
        enum: ['end_user', 'admin'],
        default: 'end_user',
    })
    user_type!: UserType;

    /**
     * Two-factor method type.
     */
    @Column({
        type: 'enum',
        enum: ['email', 'authenticator', 'sms'],
    })
    method_type!: TwoFactorMethod;

    /**
     * Whether this method is the primary one.
     */
    @Column({
        type: 'boolean',
        default: false,
    })
    is_primary!: boolean;

    /**
     * Whether this method is enabled.
     */
    @Column({
        type: 'boolean',
        default: true,
    })
    is_enabled!: boolean;

    /**
     * Sensitive secret (e.g., TOTP secret or encrypted data).
     */
    @Column({
        type: 'text',
        nullable: true,
    })
    secret_data?: string | null;

    /**
     * Extra metadata (issuer, phone last4, labels, etc.).
     */
    @Column({
        type: 'jsonb',
        nullable: true,
    })
    metadata?: Record<string, any> | null;

    /**
     * Creation timestamp.
     */
    @CreateDateColumn({
        type: 'timestamp',
        name: 'created_at',
    })
    created_at!: Date;

    /**
     * Update timestamp.
     */
    @UpdateDateColumn({
        type: 'timestamp',
        name: 'updated_at',
    })
    updated_at!: Date;

    /**
     * OPTIONAL relation to end-user (no DB FK).
     * Use when user_type === 'end_user'.
     */
    @ManyToOne(
        () => User,
        {
            onDelete: 'CASCADE',
            nullable: true,
            /**
             * Keep polymorphic model without DB constraint.
             */
            createForeignKeyConstraints: false,
        },
    )
    @JoinColumn({ name: 'user_id' })
    user?: User | null;

    /**
     * OPTIONAL relation to admin user (no DB FK).
     * Use when user_type === 'admin'.
     */
    @ManyToOne(
        () => AdminUser,
        {
            onDelete: 'CASCADE',
            nullable: true,
            createForeignKeyConstraints: false,
        },
    )
    @JoinColumn({ name: 'user_id' })
    admin?: AdminUser | null;

    /**
     * Helper discriminators.
     */
    isAdminOwner(): boolean {
        return this.user_type === 'admin';
    }

    isEndUserOwner(): boolean {
        return this.user_type === 'end_user';
    }
}
