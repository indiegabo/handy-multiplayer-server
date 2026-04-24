// ./test/hms/entities/media-associations.mock.ts
import { MediaAssociation } from
    '@hms-module/modules/media/entities/media-association.entity';
import { MEDIA_MOCK } from './media.mock';

/**
 * Helper to build class instances (not plain objects),
 * keeping decorators/methods on prototype intact.
 */
function makeAssociation(init: {
    id: string;
    entity_type: string;
    entity_id: string;
    collection_name: string | null;
    media_id: string;
    position?: number;
}): MediaAssociation {
    const now = new Date();
    return Object.assign(new MediaAssociation(), {
        id: init.id,
        entity_type: init.entity_type,
        entity_id: init.entity_id,
        collection_name: init.collection_name,
        media_id: init.media_id,
        media: MEDIA_MOCK.find(m => m.id === init.media_id)!,
        position: init.position ?? 0,
        created_at: now,
    });
}

export const MEDIA_ASSOCIATIONS_MOCK: MediaAssociation[] = [
    makeAssociation({
        id: 'aaaaaaa1-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        entity_type: 'user',
        entity_id: '11111111-1111-4111-8111-111111111111', // user UUID
        collection_name: 'avatar',
        media_id: MEDIA_MOCK[0].id, // assume MEDIA_MOCK[*].id é UUID
    }),
    makeAssociation({
        id: 'aaaaaaa2-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
        entity_type: 'product',
        entity_id: '55555555-5555-4555-8555-555555555555', // product UUID
        collection_name: 'gallery',
        media_id: MEDIA_MOCK[1].id,
        position: 0,
    }),
    makeAssociation({
        id: 'aaaaaaa3-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
        entity_type: 'user',
        entity_id: '11111111-1111-4111-8111-111111111111',
        collection_name: 'documents',
        media_id: MEDIA_MOCK[3].id,
        position: 1,
    }),
    makeAssociation({
        id: 'aaaaaaa4-aaaa-4aaa-8aaa-aaaaaaaaaaa4',
        entity_type: 'blog_post',
        entity_id: '33333333-3333-4333-8333-333333333333',
        collection_name: null, // null permitido
        media_id: MEDIA_MOCK[2].id,
    }),
];
