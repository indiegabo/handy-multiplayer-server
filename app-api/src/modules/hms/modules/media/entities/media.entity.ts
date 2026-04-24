import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
} from 'typeorm';

export type MediaType = 'image' | 'video' | 'audio' | 'document';

/**
 * Media entity mapped to `hms_media`.
 * Uses UUID primary key to align with migrations.
 */
@Entity({ name: 'hms_media' })
export class Media {
    /**
     * Primary key as UUID (generated in DB via uuid_generate_v4()).
     */
    @PrimaryGeneratedColumn('uuid')
    id: string;

    /**
     * Absolute or resolvable URL for the media resource.
     */


    /**
     * Media type backed by a PostgreSQL enum.
     */
    @Column({
        type: 'enum',
        enum: ['image', 'video', 'audio', 'document'],
    })
    type: MediaType;

    /**
     * Original filename as provided by the client or storage.
     */
    @Column({
        type: 'varchar',
        length: 255,
    })
    filename: string;

    /**
     * MIME type (e.g., image/png, video/mp4).
     */
    @Column({
        type: 'varchar',
        length: 100,
    })
    mimetype: string;

    /**
     * File size in bytes.
     * Use string in TypeScript for PostgreSQL bigint to avoid precision loss.
     */
    @Column({
        type: 'bigint',
    })
    size: number;

    /**
     * Arbitrary metadata; stored as jsonb for efficient querying in Postgres.
     */
    @Column({
        type: 'jsonb',
        nullable: true,
    })
    metadata?: Record<string, any> | null;

    /**
     * Creation timestamp.
     * Mirrors migration default CURRENT_TIMESTAMP.
     */
    @CreateDateColumn({
        name: 'created_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
    })
    created_at: Date;

    /**
     * Update timestamp.
     * Mirrors migration default CURRENT_TIMESTAMP + onUpdate.
     */
    @UpdateDateColumn({
        name: 'updated_at',
        type: 'timestamp',
        default: () => 'CURRENT_TIMESTAMP',
        onUpdate: 'CURRENT_TIMESTAMP',
    })
    updated_at: Date;
}
