/**
 * Represents a media resource exposed to the frontend.
 * Used for profile pictures, galleries, documents, etc.
 */
export type MediaView = {
    /**
     * Unique identifier for the media.
     */
    id: string;

    /**
     * Public or presigned URL to access this media.
     */
    url: string;

    /**
     * Type of media (image, video, audio, document).
     */
    type: 'image' | 'video' | 'audio' | 'document';

    /**
     * Original filename as uploaded.
     */
    filename: string;

    /**
     * MIME type (e.g., image/png, video/mp4).
     */
    mimetype: string;

    /**
     * File size in bytes.
     */
    size: number;

    /**
     * Optional custom metadata (JSON serializable).
     */
    metadata?: Record<string, any> | null;

    /**
     * Creation timestamp.
     */
    created_at: string;

    /**
     * Last update timestamp.
     */
    updated_at: string;
};
