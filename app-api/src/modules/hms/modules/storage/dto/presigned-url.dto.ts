export type PresignedURLDTO = {
    url: string;
    expires_at?: Date;
    method?: string;
    file_key?: string;
    bucket?: string;
    content_type?: string;
    size_limit?: number;
    checksum?: string;
}