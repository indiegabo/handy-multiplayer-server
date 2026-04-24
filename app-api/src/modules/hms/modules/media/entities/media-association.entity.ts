import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    Index,
} from 'typeorm';
import { Media } from './media.entity';

/**
 * Polymorphic association between any entity and a Media.
 * Supports ordered collections via "position".
 */
@Entity({ name: 'hms_media_association' })
@Index('IDX_MEDIA_ASSOCIATION_ENTITY', ['entity_type', 'entity_id'])
@Index('IDX_MEDIA_ASSOCIATION_COLLECTION', ['collection_name'])
@Index(
    'UQ_MEDIA_ASSOCIATION_UNIQUE_MEDIA',
    ['entity_type', 'entity_id', 'collection_name', 'media_id'],
    { unique: true },
)
@Index(
    'UQ_MEDIA_ASSOCIATION_POSITION',
    ['entity_type', 'entity_id', 'collection_name', 'position'],
    { unique: true },
)
export class MediaAssociation {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @Column({ name: 'entity_type', type: 'varchar', length: 255 })
    entity_type!: string;

    @Column({ name: 'entity_id', type: 'uuid' })
    entity_id!: string;

    @Column({
        name: 'collection_name',
        type: 'varchar',
        length: 50,
        nullable: true,
    })
    collection_name?: string | null;

    @Column({ name: 'media_id', type: 'uuid' })
    media_id!: string;

    @ManyToOne(() => Media, { onDelete: 'CASCADE', eager: false })
    @JoinColumn({ name: 'media_id', referencedColumnName: 'id' })
    media!: Media;

    /**
     * 0-based position inside the collection.
     * For single media collections, always 0.
     */
    @Column({ name: 'position', type: 'int', default: 0 })
    position!: number;

    @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
    created_at!: Date;
}
