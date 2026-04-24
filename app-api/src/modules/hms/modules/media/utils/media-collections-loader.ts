import { Injectable } from '@nestjs/common';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MediaAssociation } from '../entities/media-association.entity';
import { Media } from '../entities/media.entity';

export type MediaCollectionsMap =
    Record<string, Record<string, Media[]>>;

@Injectable()
export class MediaCollectionsLoader {
    constructor(
        @InjectRepository(MediaAssociation)
        private readonly assocRepo: Repository<MediaAssociation>,
    ) { }

    async loadForEntityIds(
        entityType: string,
        entityIds: string[],
        collections?: string[],
    ): Promise<MediaCollectionsMap> {
        if (!entityIds.length) return {};

        const where: any = {
            entity_type: entityType,
            entity_id: In(entityIds),
        };
        if (collections?.length) {
            where.collection_name = In(collections);
        }

        const rows = await this.assocRepo.find({
            where,
            relations: ['media'],
            order: {
                position: 'ASC',
                created_at: 'ASC',
            },
        });

        const out: MediaCollectionsMap = {};
        for (const row of rows) {
            const eid = row.entity_id;
            const cname = row.collection_name ?? 'default';
            if (!out[eid]) out[eid] = {};
            if (!out[eid][cname]) out[eid][cname] = [];
            out[eid][cname].push(row.media);
        }
        return out;
    }

    attachToEntities<T extends { id: string }>(
        entities: T[],
        map: MediaCollectionsMap,
    ): (T & { media_collections: Record<string, Media[]> })[] {
        return entities.map((e) => {
            const collections = map[e.id] ?? {};
            return Object.assign(e, { media_collections: collections });
        });
    }
}
