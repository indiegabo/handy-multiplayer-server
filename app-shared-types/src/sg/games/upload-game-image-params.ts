/**
 * Parameters used when uploading a game image via backoffice use-cases.
 * Placed under `sg/games` because it is SG-specific.
 */

export type UploadGameImageParams = {
    gameId: string;
    // Browser-safe binary payload. Back-end can accept Node `Buffer` or `Uint8Array`.
    buffer: Uint8Array | ArrayBuffer;
    originalName: string;
    mimetype: string;
    size: number;
    ratio: string; // use GameImageRatios from shared types (e.g. GameImageRatios.WIDE_16_9)
};
