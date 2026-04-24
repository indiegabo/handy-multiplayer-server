/**
 * DTO that represents an image exposed to API consumers.
 * Contains a resolved public URL and optional metadata.
 */

export type ImageDTO = {
    url: string; // public or presigned URL
    filename?: string;
    mimetype?: string;
    size?: number;
};
