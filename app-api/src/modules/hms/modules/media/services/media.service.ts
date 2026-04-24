import {
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';

import { MediaCollectionsLoader }
    from '../utils/media-collections-loader';
import { Media } from '../entities/media.entity';
import { MediaAssociation } from '../entities/media-association.entity';
import { StorageService }
    from '../../storage/services/storage.service';
import { PresignedURLDTO }
    from '../../storage/dto/presigned-url.dto';
import {
    MediaView,
    MetadataConditions,
    MetadataConditionValue,
} from '@hms/shared-types/hms';

export type AttachMappingOptions = {
    /**
     * Maps collection names to target field names in the result object.
     * Example:
     *   { profile: 'profile_picture', pets: 'pets_pictures' }
     */
    fieldMap?: Record<string, string>;
    /**
     * Collections that must collapse to a single MediaView (take first).
     * Example:
     *   ['profile']
     */
    singletons?: string[];
    /**
     * If true, include "media_collections" in the output. Default: false.
     */
    includeCollectionsField?: boolean;
    /**
     * If true, set null for missing singletons (so JSON shows the key).
     * Default: true.
     */
    emitNullForMissing?: boolean;
    /**
     * For non-singleton mapped arrays, emit [] when empty. Default: true.
     */
    emitEmptyArrayForLists?: boolean;
};

@Injectable()
export class MediaService {
    constructor(
        private readonly loader: MediaCollectionsLoader,
        private readonly storage: StorageService,
        @InjectRepository(Media)
        private readonly mediaRepository: Repository<Media>,
        @InjectRepository(MediaAssociation)
        private readonly associationRepository: Repository<MediaAssociation>,
    ) { }

    // ------------------------------------------------------------------
    // Upload flow (presign + finalize)
    // ------------------------------------------------------------------

    /**
     * Creates a presigned URL to upload a file to S3.
     * Client should PUT to this URL, then call finalize afterwards.
     */
    async createUploadUrl(
        keyPrefix: string,
        filename: string,
        contentType: string,
        expiresInSeconds = 900,
    ): Promise<PresignedURLDTO> {
        const safeName = filename.replace(/[^\w.\-]/g, '_');
        const fileKey = `${keyPrefix}/${Date.now()}_${safeName}`;
        return this.storage.generateUploadPreSignedUrl(
            fileKey,
            contentType,
            expiresInSeconds,
        );
    }

    /**
     * Finalizes an upload by creating a Media and (optionally) attaching it.
     * If attaching to a singleton collection, replaces prior media.
     */
    async finalizeUploadAndAttach(
        fileKey: string,
        params: {
            filename: string;
            mimetype: string;
            size?: number;
            metadata?: Record<string, any>;
            entity?: {
                type: string;
                id: string;
                collection?: string;
                asSingleton?: boolean;
                position?: number;
            };
        },
    ): Promise<{ media: Media; association?: MediaAssociation }> {
        const exists = await this.storage.checkFileExists(fileKey);
        if (!exists) {
            throw new NotFoundException(`Uploaded object not found: ${fileKey}`);
        }

        const media = this.mediaRepository.create({
            // Persist storage key inside metadata.file_key instead of url column.
            type: this.determineMediaType(params.mimetype),
            filename: params.filename,
            mimetype: params.mimetype,
            size: params.size ?? 0,
            metadata: {
                ...(params.metadata ?? {}),
                file_key: fileKey,
            },
        });
        const saved = await this.mediaRepository.save(media);

        if (!params.entity) return { media: saved };

        const assoc = await this.attachMedia(
            params.entity.type,
            params.entity.id,
            saved.id,
            params.entity.collection,
            {
                asSingleton: !!params.entity.asSingleton,
                position: params.entity.position,
            },
        );

        return { media: saved, association: assoc };
    }

    // ------------------------------------------------------------------
    // CRUD helpers (multer)
    // ------------------------------------------------------------------

    async createMediaFromMulter(
        file: Express.Multer.File,
        metadata?: Record<string, any>,
    ): Promise<Media> {
        const media = this.mediaRepository.create({
            type: this.determineMediaType(file.mimetype),
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            metadata: {
                ...(metadata ?? {}),
                file_key: file.path,
            },
        });
        return this.mediaRepository.save(media);
    }

    // ------------------------------------------------------------------
    // Associations API (singletons + collections with ordering)
    // ------------------------------------------------------------------

    async attachMedia(
        entity_type: string,
        entity_id: string,
        media_id: string,
        collection_name?: string,
        opts?: { asSingleton?: boolean; position?: number },
    ): Promise<MediaAssociation> {
        const media = await this.mediaRepository.findOne({
            where: { id: media_id },
        });
        if (!media) {
            throw new NotFoundException('Media not found');
        }

        if (opts?.asSingleton) {
            await this.associationRepository.delete({
                entity_type,
                entity_id,
                collection_name,
            });
            const assoc = this.associationRepository.create({
                entity_type,
                entity_id,
                media_id,
                collection_name,
                position: 0,
            });
            return this.associationRepository.save(assoc);
        }

        let position = 0;
        if (typeof opts?.position === 'number' && opts.position >= 0) {
            await this.shiftRightFromPosition(
                entity_type,
                entity_id,
                collection_name,
                opts.position,
            );
            position = opts.position;
        } else {
            position = await this.getNextPosition(entity_type, entity_id, collection_name);
        }

        const assoc = this.associationRepository.create({
            entity_type,
            entity_id,
            media_id,
            collection_name,
            position,
        });
        return this.associationRepository.save(assoc);
    }


    async setCollection(
        entity_type: string,
        entity_id: string,
        collection_name: string,
        ordered_media_ids: string[],
    ): Promise<void> {
        await this.associationRepository.delete({
            entity_type,
            entity_id,
            collection_name,
        });

        if (!ordered_media_ids.length) return;

        const found = await this.mediaRepository.find({
            where: { id: In(ordered_media_ids) },
        });
        const valid = new Set(found.map((m) => m.id));

        const rows = ordered_media_ids
            .filter((id) => valid.has(id))
            .map((id, idx) =>
                this.associationRepository.create({
                    entity_type,
                    entity_id,
                    collection_name,
                    media_id: id,
                    position: idx,
                }),
            );

        if (rows.length) await this.associationRepository.save(rows);
    }

    async reorderCollection(
        entity_type: string,
        entity_id: string,
        collection_name: string,
        ordered_media_ids: string[],
    ): Promise<void> {
        const existing = await this.associationRepository.find({
            where: { entity_type, entity_id, collection_name },
            order: { position: 'ASC' },
        });

        const indexById = new Map<string, MediaAssociation>();
        existing.forEach((a) => indexById.set(a.media_id, a));

        let nextPos = 0;
        for (const id of ordered_media_ids) {
            const row = indexById.get(id);
            if (!row) continue;
            if (row.position !== nextPos) row.position = nextPos;
            nextPos++;
        }

        for (const row of existing) {
            if (!ordered_media_ids.includes(row.media_id)) {
                row.position = nextPos++;
            }
        }
        await this.associationRepository.save(existing);
    }

    async detachMedia(
        entity_type: string,
        entity_id: string,
        media_id: string,
        collection_name?: string,
    ): Promise<void> {
        await this.associationRepository.delete({
            entity_type,
            entity_id,
            media_id,
            collection_name,
        });
    }

    /**
     * Deletes a media record by id.
     * Associations are automatically removed by database cascade.
     */
    async deleteMediaById(mediaId: string): Promise<void> {
        await this.mediaRepository.delete({ id: mediaId });
    }

    // ------------------------------------------------------------------
    // Query + projection helpers
    // ------------------------------------------------------------------

    /**
     * Attaches "media_collections" with raw Media and optionally projects
     * mapped fields (singletons collapse to a single Media).
     */
    async attachTo<T extends { id: string }>(
        entityType: string,
        entities: T[],
        collections?: string[],
        mapping?: AttachMappingOptions,
    ): Promise<
        (T & { media_collections: Record<string, Media[]> } & Record<string, any>)[]
    > {
        const ids = entities.map((e) => e.id);
        const map = await this.loader.loadForEntityIds(entityType, ids, collections);
        const res = this.loader.attachToEntities(entities, map);

        if (!mapping?.fieldMap) return res;

        const singletons = new Set(mapping.singletons ?? []);
        for (const e of res as any[]) {
            for (const [from, to] of Object.entries(mapping.fieldMap)) {
                const list: Media[] = e.media_collections?.[from] ?? [];
                e[to] = singletons.has(from) ? (list[0] ?? undefined) : list;
            }
        }
        return res;
    }

    /**
     * Same as attachTo, but projects mapped fields and collections as
     * MediaView/MediaView[]. Also hides "media_collections" by default and
     * emits null/[] when missing to keep keys in JSON.
     */
    async attachToView<T extends { id: string }>(
        entityType: string,
        entities: T[],
        collections?: string[],
        mapping?: AttachMappingOptions,
    ): Promise<
        (T & { media_collections?: Record<string, MediaView[]> } & Record<string, any>)[]
    > {
        const opts: Required<AttachMappingOptions> = {
            fieldMap: mapping?.fieldMap ?? {},
            singletons: mapping?.singletons ?? [],
            includeCollectionsField: mapping?.includeCollectionsField ?? false,
            emitNullForMissing: mapping?.emitNullForMissing ?? true,
            emitEmptyArrayForLists: mapping?.emitEmptyArrayForLists ?? true,
        };

        // Load with Media, reuse projection logic
        const withMedia = await this.attachTo(
            entityType,
            entities,
            collections,
            {
                fieldMap: opts.fieldMap,
                singletons: opts.singletons,
            },
        );

        // Convert media_collections -> MediaView[] (resolving URLs)
        for (const e of withMedia as any[]) {
            const mc = e.media_collections as Record<string, Media[]>;
            const viewCollections: Record<string, MediaView[]> = {};
            if (mc) {
                for (const [k, list] of Object.entries(mc)) {
                    viewCollections[k] = await this.toMediaViewsAsync(list);
                }
            }
            if (opts.includeCollectionsField) {
                e.media_collections = viewCollections;
            } else {
                delete e.media_collections;
            }
        }

        // Convert mapped fields to MediaView/MediaView[]
        const singletons = new Set(opts.singletons);
        for (const e of withMedia as any[]) {
            for (const [from, to] of Object.entries(opts.fieldMap)) {
                // We must rebuild from the previously attached raw Media mapping.
                // If no raw mapping (no items), ensure null/[] accordingly.
                const rawList: Media[] =
                    (e.media_collections_raw?.[from] as Media[]) ??
                    []; // not used here, kept for clarity

                // Use loader again from the original attach (already on object):
                // When attachTo ran, it set e[to] as Media | Media[].
                const projected = e[to] as Media | Media[] | undefined;

                if (singletons.has(from)) {
                    if (!projected) {
                        e[to] = opts.emitNullForMissing ? null : undefined;
                    } else {
                        // Single Media -> MediaView
                        const item = Array.isArray(projected)
                            ? (projected[0] as Media | undefined)
                            : (projected as Media);
                        e[to] = item ? this.toMediaView(item) : (opts.emitNullForMissing ? null : undefined);
                    }
                } else {
                    const list = Array.isArray(projected) ? (projected as Media[]) : [];
                    e[to] = list.length
                        ? this.toMediaViews(list)
                        : (opts.emitEmptyArrayForLists ? [] : undefined);
                }
            }
        }

        return withMedia as any;
    }

    /**
     * Find media items attached to an entity collection that match JSON metadata
     * conditions. Conditions support equality and "IN" semantics when the
     * condition value is an array.
     *
     * Examples:
     *  { ratio: '16:9' }
     *  { ratio: ['16:9', '2:3'], tag: 'cover' }
     */
    async findMediaByMetadataConditions(
        entityType: string,
        entityId: string,
        collectionName: string,
        conditions?: MetadataConditions,
    ): Promise<Media[]> {
        const qb = this.associationRepository
            .createQueryBuilder('a')
            .innerJoinAndSelect('a.media', 'm')
            .where('a.entity_type = :entityType', { entityType })
            .andWhere('a.entity_id = :entityId', { entityId })
            .andWhere('a.collection_name = :collectionName', { collectionName });

        if (conditions && Object.keys(conditions).length) {
            // Build safe JSON path predicates. We only allow simple top-level
            // metadata keys that match \w (alphanumeric + _).
            const params: Record<string, any> = {};
            let idx = 0;
            for (const [key, value] of Object.entries(conditions)) {
                if (!/^[A-Za-z0-9_]+$/.test(key)) {
                    throw new Error(`Invalid metadata key: ${key}`);
                }
                idx += 1;
                if (Array.isArray(value)) {
                    const paramName = `vals_${idx}`;
                    qb.andWhere(`m.metadata ->> '${key}' IN (:...${paramName})`);
                    params[paramName] = (value as Array<string | number>).map(String);
                } else {
                    const paramName = `val_${idx}`;
                    qb.andWhere(`m.metadata ->> '${key}' = :${paramName}`);
                    params[paramName] = String(value as string | number);
                }
            }
            qb.setParameters(params);
        }

        qb.orderBy('a.position', 'ASC');

        const associations = await qb.getMany();
        return associations.map((a) => a.media);
    }

    /**
     * Find a single media item attached to an entity collection that matches
     * the provided metadata conditions. Returns the first matched item or
     * undefined when none found.
     */
    async findOneMediaByMetadataConditions(
        entityType: string,
        entityId: string,
        collectionName: string,
        conditions?: MetadataConditions,
    ): Promise<Media | undefined> {
        const list = await this.findMediaByMetadataConditions(
            entityType,
            entityId,
            collectionName,
            conditions,
        );
        return list.length ? list[0] : undefined;
    }

    // ------------------------------------------------------------------
    // Mapping helpers
    // ------------------------------------------------------------------

    toMediaView(media: Media): MediaView {
        // Synchronous projection: prefer metadata.file_key when available.
        const fileKey = (media.metadata && (media.metadata as any).file_key) ?? (media as any).url ?? '';
        return {
            id: media.id,
            url: fileKey,
            type: media.type,
            filename: media.filename,
            mimetype: media.mimetype,
            size: Number(media.size),
            metadata: media.metadata ?? null,
            created_at: media.created_at.toISOString(),
            updated_at: media.updated_at.toISOString(),
        } as MediaView;
    }

    toMediaViews(list: Media[]): MediaView[] {
        return list.map((m) => this.toMediaView(m));
    }

    // Async helpers that resolve URLs via StorageService
    private async toMediaViewAsync(media: Media): Promise<MediaView> {
        const fileKey = (media.metadata && (media.metadata as any).file_key) ?? (media as any).url ?? '';
        const resolvedUrl = await this.storage.getResolvedUrl(fileKey);
        return {
            id: media.id,
            url: resolvedUrl,
            type: media.type,
            filename: media.filename,
            mimetype: media.mimetype,
            size: Number(media.size),
            metadata: media.metadata ?? null,
            created_at: media.created_at.toISOString(),
            updated_at: media.updated_at.toISOString(),
        } as MediaView;
    }

    private async toMediaViewsAsync(list: Media[]): Promise<MediaView[]> {
        const out: MediaView[] = [];
        for (const m of list) out.push(await this.toMediaViewAsync(m));
        return out;
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    private determineMediaType(
        mimeType: string,
    ): 'image' | 'video' | 'audio' | 'document' {
        if (mimeType.startsWith('image/')) return 'image';
        if (mimeType.startsWith('video/')) return 'video';
        if (mimeType.startsWith('audio/')) return 'audio';
        return 'document';
    }

    private async getNextPosition(
        entity_type: string,
        entity_id: string,
        collection_name?: string,
    ): Promise<number> {
        const qb = this.associationRepository
            .createQueryBuilder('a')
            .select('MAX(a.position)', 'max')
            .where('a.entity_type = :t', { t: entity_type })
            .andWhere('a.entity_id = :i', { i: entity_id });

        if (collection_name === undefined) {
            qb.andWhere('a.collection_name IS NULL');
        } else {
            qb.andWhere('a.collection_name = :c', { c: collection_name });
        }

        const raw = await qb.getRawOne<{ max: number | null }>();
        return (raw?.max ?? -1) + 1;
    }

    private async shiftRightFromPosition(
        entity_type: string,
        entity_id: string,
        collection_name: string | undefined,
        fromInclusive: number,
    ): Promise<void> {
        const rows = await this.associationRepository.find({
            where: {
                entity_type,
                entity_id,
                collection_name: collection_name ?? null,
            } as any,
            select: ['id', 'position'],
            order: { position: 'DESC' },
        });

        const needShift = rows.filter((r) => r.position >= fromInclusive);
        if (!needShift.length) return;

        for (const r of needShift) r.position++;
        await this.associationRepository.save(needShift);
    }
}
