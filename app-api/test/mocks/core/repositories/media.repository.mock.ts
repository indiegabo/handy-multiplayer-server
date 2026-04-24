import { jest } from "@jest/globals";
import { MediaRepository } from
    "@hms-module/modules/media/media.repository";
import { MEDIA_MOCK } from "../entities/media.mock";
import { Media } from
    "@hms-module/modules/media/entities/media.entity";

// Helpers to safely handle mixed id types (number | string)
function toNumericId(id: unknown): number | null {
    if (typeof id === "number") return Number.isFinite(id) ? id : null;
    if (typeof id === "string") {
        const n = Number(id);
        return Number.isFinite(n) ? n : null;
    }
    return null;
}

function equalsNumericId(entity: Media, id: number): boolean {
    const n = toNumericId((entity as any).id);
    return n !== null && n === id;
}

function maxNumericId(list: Media[]): number {
    return list.reduce((max, item) => {
        const n = toNumericId((item as any).id);
        return n !== null && n > max ? n : max;
    }, 0);
}

// Define a type for the complete mocked MediaRepository
export type MockMediaRepository =
    Partial<Record<keyof MediaRepository, jest.Mock>> & {
        getInternalMediaCount?: jest.Mock;
    };

export const createMockMediaRepository = (
    initialMedia: Media[] = MEDIA_MOCK,
): MockMediaRepository => {
    let currentMedia: Media[] = structuredClone(initialMedia);

    // Start nextId from the max numeric id present; fallback to 1
    let nextId = maxNumericId(currentMedia) + 1;

    const mediaRepositoryMock: MockMediaRepository = {
        findById: jest.fn().mockImplementation(async (id: number) => {
            return currentMedia.find((media) => equalsNumericId(media, id)) || null;
        }),

        create: jest.fn().mockImplementation(async (
            mediaData: Partial<Media>,
        ) => {
            // Force a numeric id for mock convenience
            const media: Media = {
                ...(mediaData as Media),
                id: nextId++ as unknown as any,
                url: mediaData.url || "",
                type: mediaData.type || "image",
                filename: mediaData.filename || "",
                mimetype: mediaData.mimetype || "",
                size: mediaData.size || 0,
                metadata: mediaData.metadata ?? null,
            };

            currentMedia.push(media);
            return media;
        }),

        save: jest.fn().mockImplementation(async (media: Media) => {
            // If id is not numeric, assign a numeric one for the mock
            let numericId = toNumericId((media as any).id);
            if (numericId === null) {
                (media as any).id = nextId++ as unknown as any;
                numericId = toNumericId((media as any).id)!;
            }

            const idx = currentMedia.findIndex((m) =>
                equalsNumericId(m, numericId!),
            );

            if (idx !== -1) {
                currentMedia[idx] = { ...media };
            } else {
                currentMedia.push({ ...media });
            }
            return media;
        }),

        delete: jest.fn().mockImplementation(async (id: number) => {
            currentMedia = currentMedia.filter((media) =>
                !equalsNumericId(media, id),
            );
            return;
        }),

        findByFilename: jest.fn().mockImplementation(async (filename: string) => {
            return currentMedia.find((m) => m.filename === filename) || null;
        }),

        findByUrl: jest.fn().mockImplementation(async (url: string) => {
            return currentMedia.find((m) => m.url === url) || null;
        }),

        findAllByType: jest.fn().mockImplementation(async (
            type: "image" | "video" | "audio" | "document",
        ) => {
            return currentMedia.filter((m) => m.type === type);
        }),

        getInternalMediaCount: jest.fn().mockImplementation(() =>
            currentMedia.length
        ),
    };

    return mediaRepositoryMock;
};
