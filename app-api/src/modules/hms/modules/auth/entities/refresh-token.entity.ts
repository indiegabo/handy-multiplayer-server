import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { AdminUser } from '../../users/entities/admin-user.entity';
import { UserType } from "@hms/shared-types/hms";
import { DeviceInfo } from '../types/device-info.type';

@Entity('hms_refresh_tokens')
@Index(
    'IDX_hms_rt_user_type_id',
    ['user_type', 'user_id'],
)
@Index(
    'IDX_hms_rt_expires_at',
    ['expires_at'],
)
@Index(
    'IDX_hms_rt_is_revoked',
    ['is_revoked'],
)
@Index(
    'UQ_hms_rt_token',
    ['token'],
    { unique: true },
)
export class RefreshToken {
    /**
     * Primary key (UUID v4).
     */
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Refresh token string (consider hashing in production).
     */
    @Column({
        type: 'text',
    })
    token!: string;

    /**
     * Polymorphic owner id (UUID).
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
     * Device fingerprint / context.
     */
    @Column({
        type: 'jsonb',
        nullable: true,
    })
    device_info?: DeviceInfo | null;

    /**
     * IP address (IPv4/IPv6 text).
     */
    @Column({
        type: 'varchar',
        length: 45,
        nullable: true,
    })
    ip_address?: string | null;

    /**
     * Revocation flag.
     */
    @Column({
        type: 'boolean',
        default: false,
    })
    is_revoked!: boolean;

    /**
     * Last time this token was used.
     */
    @Column({
        type: 'timestamp',
        name: 'last_used_at',
        default: () => 'CURRENT_TIMESTAMP',
    })
    last_used_at!: Date;

    /**
     * Expiration timestamp.
     */
    @Column({
        type: 'timestamp',
        name: 'expires_at',
    })
    expires_at!: Date;

    /**
     * Number of times this token was rotated/used.
     */
    @Column({
        type: 'int',
        default: 0,
        name: 'refresh_count',
    })
    refresh_count!: number;

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
     * Helpers.
     */
    isExpired(at: Date = new Date()): boolean {
        return this.expires_at.getTime() <= at.getTime();
    }

    belongsToAdmin(): boolean {
        return this.user_type === 'admin';
    }
}
