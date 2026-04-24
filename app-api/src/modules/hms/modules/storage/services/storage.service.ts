import {
    HeadObjectCommand,
    GetObjectCommand,
    S3Client,
    DeleteObjectCommand,
    CopyObjectCommand,
    PutObjectCommand,
    ListObjectsV2Command
} from "@aws-sdk/client-s3";
import {
    Inject,
    Injectable,
    InternalServerErrorException,
    NotFoundException
} from "@nestjs/common";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { BetterLogger }
    from "@hms-module/modules/better-logger/better-logger.service";
import { PresignedURLDTO } from "../dto/presigned-url.dto";

export type ListObjectsPaginatedResult = {
    objects: { Key: string }[];
    isTruncated: boolean;
    nextContinuationToken: string | null;
};

@Injectable()
export class StorageService {
    constructor(
        @Inject('S3_CLIENT') private readonly s3Client: S3Client,
        @Inject('AWS_S3_BUCKET_NAME') private readonly bucketName: string,
        private logger: BetterLogger,
    ) { }

    async checkFileExists(fileKey: string): Promise<boolean> {
        try {
            await this.s3Client.send(
                new HeadObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileKey,
                })
            );
            return true;
        } catch (error) {
            if (
                error.name === 'NotFound' ||
                error.$metadata?.httpStatusCode === 404
            ) {
                return false;
            }
            throw new InternalServerErrorException(
                `Error checking file existence: ${error.message}`
            );
        }
    }

    /**
     * Deletes an object from the bucket.
     * Throws if AWS returns an error.
     */
    async deleteObject(fileKey: string): Promise<void> {
        try {
            await this.s3Client.send(
                new DeleteObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileKey,
                })
            );
        } catch (error) {
            this.logger.error(`Error deleting object ${fileKey}:`, error);
            throw new InternalServerErrorException(
                `Failed to delete object ${fileKey}: ${error.message}`
            );
        }
    }

    /**
     * Deletes an object only if it exists. Returns true if deleted, false if absent.
     */
    async deleteObjectIfExists(fileKey: string): Promise<boolean> {
        const exists = await this.checkFileExists(fileKey);
        if (!exists) return false;
        await this.deleteObject(fileKey);
        return true;
    }

    /**
     * Deletes the .zip and its companion .meta.json (if present).
     * It tolerates missing meta file (no throw). Throws if zip deletion fails.
     */
    async deleteZipAndMeta(zipKey: string): Promise<void> {
        // Delete the zip first; if this fails, we should stop early.
        await this.deleteObject(zipKey);

        // Try to delete the meta file, but do not fail if it doesn't exist.
        const metaKey = zipKey.endsWith('.zip')
            ? zipKey.replace(/\.zip$/i, '.meta.json')
            : `${zipKey}.meta.json`;

        try {
            await this.deleteObjectIfExists(metaKey);
        } catch (err) {
            // Non-fatal: we log and continue, since zip is the source of truth.
            this.logger.warn(
                `Could not delete meta for ${zipKey} (key: ${metaKey}).`
            );
        }
    }

    /**
     * Generates a pre-signed URL for downloading an object.
     */
    async getDownloadPreSignedUrl(
        fileKey: string,
        expiresInSeconds: number = 3600
    ): Promise<PresignedURLDTO> {
        try {
            const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            });

            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: expiresInSeconds
            });

            return {
                url,
                expires_at: expiresAt,
                method: 'GET',
                file_key: fileKey,
                bucket: this.bucketName,
            };
        } catch (error) {
            this.logger.error(`Error generating download URL:`, error);
            throw new InternalServerErrorException(
                `Failed to generate download URL: ${error.message}`
            );
        }
    }

    async generateUploadPreSignedUrl(
        fileKey: string,
        contentType: string,
        expiresInSeconds: number = 3600,
        sizeLimit?: number
    ): Promise<PresignedURLDTO> {
        try {
            const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
            const command = new PutObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
                ContentType: contentType,
            });

            const url = await getSignedUrl(this.s3Client, command, {
                expiresIn: expiresInSeconds
            });

            return {
                url,
                expires_at: expiresAt,
                method: 'PUT',
                file_key: fileKey,
                bucket: this.bucketName,
                content_type: contentType,
                size_limit: sizeLimit,
            };
        } catch (error) {
            this.logger.error(`Error generating upload URL:`, error);
            throw new InternalServerErrorException(
                `Failed to generate upload URL: ${error.message}`
            );
        }
    }

    async uploadBuffer(
        fileKey: string,
        buffer: Buffer,
        contentType: string,
    ): Promise<void> {
        try {
            await this.s3Client.send(
                new PutObjectCommand({
                    Bucket: this.bucketName,
                    Key: fileKey,
                    Body: buffer,
                    ContentType: contentType,
                }),
            );
        } catch (error) {
            this.logger.error(`Error uploading buffer to ${fileKey}:`, error);
            throw new InternalServerErrorException(
                `Failed to upload object ${fileKey}: ${error.message}`,
            );
        }
    }

    /**
     * Copies an object to another key in the same bucket.
     */
    async copyObject(
        sourceKey: string,
        targetKey: string,
    ): Promise<void> {
        try {
            const encodedSource = sourceKey
                .split('/')
                .map((segment) => encodeURIComponent(segment))
                .join('/');

            await this.s3Client.send(
                new CopyObjectCommand({
                    Bucket: this.bucketName,
                    Key: targetKey,
                    CopySource: `${this.bucketName}/${encodedSource}`,
                }),
            );
        } catch (error) {
            this.logger.error(
                `Error copying object ${sourceKey} to ${targetKey}:`,
                error,
            );
            throw new InternalServerErrorException(
                `Failed to copy object ${sourceKey} to ${targetKey}: ${error.message}`,
            );
        }
    }

    /**
     * Resolve a usable URL for the given fileKey.
     * Priority:
     * 1. If `fileKey` already looks like an absolute URL, return as-is.
     * 2. If `AWS_S3_PUBLIC_BASE_URL` or `CLOUDFRONT_URL` is configured,
     *    build a public URL using that base.
     * 3. Fallback to a presigned GET URL (private buckets).
     */
    async getResolvedUrl(
        fileKey: string,
        expiresInSeconds: number = 3600,
    ): Promise<string> {
        if (!fileKey) return fileKey;

        // If already an absolute URL, return directly
        if (/^https?:\/\//i.test(fileKey)) return fileKey;

        const key = fileKey;
        const encodedKey = key
            .split('/')
            .map((segment) => encodeURIComponent(segment))
            .join('/');

        // 1) CDN / explicit public base if configured
        const cdnBase = process.env.CLOUDFRONT_URL || process.env.AWS_S3_PUBLIC_BASE_URL;
        if (cdnBase) {
            const base = cdnBase.replace(/\/$/, '');
            return `${base}/${encodedKey}`;
        }

        // 2) Build S3 public URL from bucket + region when available
        const bucket = this.bucketName || process.env.AWS_S3_BUCKET_NAME;
        const region = process.env.AWS_REGION;
        if (bucket) {
            // virtual-hosted–style. For us-east-1 use the global endpoint.
            const host = region && region !== 'us-east-1'
                ? `s3.${region}.amazonaws.com`
                : `s3.amazonaws.com`;
            return `https://${bucket}.${host}/${encodedKey}`;
        }

        // 3) Fallback: presigned URL for private buckets
        const presigned = await this.getDownloadPreSignedUrl(fileKey, expiresInSeconds);
        return presigned.url;
    }

    async getFileContents<T>(fileKey: string): Promise<T> {
        try {
            const metaFileKey = fileKey.replace('.zip', '.meta.json');
            const exists = await this.checkFileExists(metaFileKey);
            if (!exists) {
                throw new NotFoundException(`File meta not found: ${metaFileKey}`);
            }

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: metaFileKey,
            });

            const data = await this.s3Client.send(command);
            const fileBuffer = await data.Body.transformToString();
            const converted = JSON.parse(fileBuffer) as T;
            return converted;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                `Error getting file meta: ${error.message}`
            );
        }
    }

    async getFileContentsRaw(fileKey: string): Promise<string> {
        try {
            const exists = await this.checkFileExists(fileKey);
            if (!exists) {
                throw new NotFoundException(`File not found: ${fileKey}`);
            }

            const command = new GetObjectCommand({
                Bucket: this.bucketName,
                Key: fileKey,
            });

            const output = await this.s3Client.send(command);
            return await output.Body.transformToString();
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw error;
            }
            throw new InternalServerErrorException(
                `Error getting file contents: ${error.message}`
            );
        }
    }

    async listObjects(
        prefix: string,
        maxKeys: number = 1000
    ): Promise<{ Key: string }[]> {
        const response = await this.listObjectsPaginated(prefix, maxKeys);
        return response.objects;
    }

    async listObjectsPaginated(
        prefix: string,
        maxKeys: number = 1000,
        continuationToken?: string,
    ): Promise<ListObjectsPaginatedResult> {
        try {
            const command = new ListObjectsV2Command({
                Bucket: this.bucketName,
                Prefix: prefix,
                MaxKeys: maxKeys,
                ContinuationToken: continuationToken,
            });

            const response = await this.s3Client.send(command);

            if (!response.Contents) {
                return {
                    objects: [],
                    isTruncated: !!response.IsTruncated,
                    nextContinuationToken: response.NextContinuationToken ?? null,
                };
            }

            return {
                objects: response.Contents.map(object => ({
                    Key: object.Key,
                })),
                isTruncated: !!response.IsTruncated,
                nextContinuationToken: response.NextContinuationToken ?? null,
            };
        } catch (error) {
            this.logger.error(
                `Error listing objects with prefix ${prefix}:`,
                error
            );
            throw new InternalServerErrorException(
                `Failed to list objects: ${error.message}`
            );
        }
    }
}
