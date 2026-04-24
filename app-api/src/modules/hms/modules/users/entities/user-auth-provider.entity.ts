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
import { User } from './user.entity';
import { AdminUser } from './admin-user.entity';

/**
 * Polymorphic auth provider bound to either:
 * - end user (hms_users), or
 * - admin user (hms_admin_users).
 *
 * Uses the (user_type, user_id) pair.
 * Relations do not create DB FKs to keep polymorphism flexible.
 */
@Entity('hms_users_auth_providers')
@Index(
    'IDX_hms_uap_user_type_id',
    ['user_type', 'user_id'],
)
@Index(
    'UQ_hms_uap_user_provider',
    ['user_type', 'user_id', 'provider'],
    { unique: true },
)
@Index(
    'IDX_hms_uap_provider',
    ['provider'],
)
export class UserAuthProvider {
    /**
     * Primary key as UUID v4.
     */
    @PrimaryGeneratedColumn('uuid')
    id!: string;

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
    user_type!: 'end_user' | 'admin';

    /**
     * Provider key (e.g., 'google', 'github', 'discord').
     */
    @Column({
        type: 'varchar',
        length: 64,
    })
    provider!: string;

    /**
     * Provider payload (tokens, profile ids, etc.).
     */
    @Column({
        type: 'jsonb',
    })
    data!: Record<string, unknown>;

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
}
