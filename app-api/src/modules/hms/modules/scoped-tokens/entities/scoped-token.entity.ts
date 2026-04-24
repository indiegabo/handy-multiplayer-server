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
import { AdminUser } from '../../users/entities/admin-user.entity';

/**
 * ScopedToken represents an API/temporary token with scoped permissions.
 * It can be created and (optionally) revoked by an AdminUser.
 */
@Entity('hms_scoped_tokens')
@Index('UQ_hms_scoped_tokens_token', ['token'], {
    unique: true,
})
@Index('IDX_hms_scoped_tokens_revoked_at', ['revoked_at'])
export class ScopedToken {
    /**
     * Primary key (UUID v4).
     */
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    /**
     * Creator admin id (UUID).
     */
    @Column({
        type: 'uuid',
        name: 'creator_id',
        nullable: true,
    })
    creator_id?: string | null;

    /**
     * Optional relation to the creator admin.
     */
    @ManyToOne(
        () => AdminUser,
        {
            nullable: true,
            onDelete: 'SET NULL',
        },
    )
    @JoinColumn({ name: 'creator_id' })
    creator?: AdminUser | null;

    /**
     * Unique token string.
     * Consider hashing at rest in production environments.
     */
    @Column({
        type: 'varchar',
        length: 255,
        unique: true,
        nullable: false,
    })
    token!: string;

    /**
     * Array of string scopes.
     */
    @Column({
        type: 'jsonb',
        nullable: false,
        default: () => `'[]'::jsonb`,
    })
    scopes!: string[];

    /**
     * Arbitrary JSON metadata.
     */
    @Column({
        type: 'jsonb',
        nullable: true,
        default: () => `'{}'::jsonb`,
    })
    data?: Record<string, any> | null;

    /**
     * Revoker admin id (UUID).
     */
    @Column({
        type: 'uuid',
        name: 'revoker_id',
        nullable: true,
    })
    revoker_id?: string | null;

    /**
     * Optional relation to the revoker admin.
     */
    @ManyToOne(
        () => AdminUser,
        {
            nullable: true,
            onDelete: 'SET NULL',
        },
    )
    @JoinColumn({ name: 'revoker_id' })
    revoker?: AdminUser | null;

    /**
     * Revocation timestamp.
     */
    @Column({
        type: 'timestamp',
        name: 'revoked_at',
        nullable: true,
    })
    revoked_at?: Date | null;

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
     * Helper to check if token is revoked.
     */
    isRevoked(): boolean {
        return !!this.revoked_at;
    }
}
