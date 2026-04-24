// ./test/hms/entities/media.mock.ts
import { Media } from '@hms-module/modules/media/entities/media.entity';

/**
 * Helper to build class instances so decorators/methods
 * on prototype remain intact.
 */
function makeMedia(init: {
    id: string;
    url: string;
    type: 'image' | 'video' | 'audio' | 'document';
    filename: string;
    mimetype: string;
    size: number;
    metadata?: Record<string, any> | null;
}): Media {
    const now = new Date();
    return Object.assign(new Media(), {
        id: init.id,
        url: init.url,
        type: init.type,
        filename: init.filename,
        mimetype: init.mimetype,
        size: init.size,
        metadata: init.metadata ?? null,
        created_at: now,
        updated_at: now,
    });
}

export const MEDIA_MOCK: Media[] = [
    makeMedia({
        id: '11111111-1111-4111-8111-111111111111',
        url: 'https://example.com/images/avatar.jpg',
        type: 'image',
        filename: 'avatar.jpg',
        mimetype: 'image/jpeg',
        size: 102400,
        metadata: { width: 800, height: 600, alt: 'User avatar' },
    }),
    makeMedia({
        id: '22222222-2222-4222-8222-222222222222',
        url: 'https://example.com/videos/intro.mp4',
        type: 'video',
        filename: 'intro.mp4',
        mimetype: 'video/mp4',
        size: 5242880,
        metadata: { duration: 120, resolution: '1080p' },
    }),
    makeMedia({
        id: '33333333-3333-4333-8333-333333333333',
        url: 'https://example.com/documents/contract.pdf',
        type: 'document',
        filename: 'contract.pdf',
        mimetype: 'application/pdf',
        size: 256000,
        metadata: { pages: 10, signed: true },
    }),
    makeMedia({
        id: '44444444-4444-4444-8444-444444444444',
        url: 'https://example.com/audio/notification.mp3',
        type: 'audio',
        filename: 'notification.mp3',
        mimetype: 'audio/mpeg',
        size: 51200,
        metadata: { duration: 5, bitrate: 128 },
    }),
];
