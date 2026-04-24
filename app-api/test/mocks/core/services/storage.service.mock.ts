import { jest } from '@jest/globals';
import { S3Client } from "@aws-sdk/client-s3";
import { NotFoundException, InternalServerErrorException } from "@nestjs/common";
import { StorageService } from '@hms-module/modules/storage/services/storage.service';
import { PresignedURLDTO } from '@hms-module/modules/storage/dto/presigned-url.dto';
import { ListObjectsPaginatedResult } from '@hms-module/modules/storage/services/storage.service';

export type MockStorageService = Partial<Record<keyof StorageService, jest.Mock>> & {
    _mockFiles?: Record<string, { content?: string; contentType?: string; metadata?: any }>;
    _addMockFile?: jest.Mock;
    _clearMockFiles?: jest.Mock;
};

export const createMockStorageService = (
    initialFiles: Record<string, { content?: string; contentType?: string; metadata?: any }> = {}
): MockStorageService => {
    let mockFiles = { ...initialFiles };

    const mockService: MockStorageService = {
        _mockFiles: mockFiles,

        checkFileExists: jest.fn().mockImplementation(async (fileKey: string) => {
            return fileKey in mockFiles;
        }),

        getDownloadPreSignedUrl: jest.fn().mockImplementation(async (
            fileKey: string,
            expiresInSeconds: number = 3600
        ) => {
            if (!(fileKey in mockFiles)) {
                throw new NotFoundException(`File not found: ${fileKey}`);
            }

            const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
            return {
                url: `https://mock-s3-url.com/${fileKey}?expires=${expiresAt.getTime()}`,
                expires_at: expiresAt,
                method: 'GET',
                file_key: fileKey,
                bucket: 'mock-bucket',
            } as PresignedURLDTO;
        }),

        generateUploadPreSignedUrl: jest.fn().mockImplementation(async (
            fileKey: string,
            contentType: string,
            expiresInSeconds: number = 3600,
            sizeLimit?: number
        ) => {
            const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
            return {
                url: `https://mock-s3-url.com/${fileKey}?expires=${expiresAt.getTime()}`,
                expires_at: expiresAt,
                method: 'PUT',
                file_key: fileKey,
                bucket: 'mock-bucket',
                content_type: contentType,
                size_limit: sizeLimit,
            } as PresignedURLDTO;
        }),

        getFileContents: jest.fn().mockImplementation(async <T>(fileKey: string): Promise<T> => {
            const metaFileKey = fileKey.replace('.zip', '.meta.json');
            if (!(metaFileKey in mockFiles)) {
                throw new NotFoundException(`File meta not found: ${metaFileKey}`);
            }

            try {
                return mockFiles[metaFileKey].metadata as T;
            } catch (error) {
                throw new InternalServerErrorException(`Error getting file meta: ${error.message}`);
            }
        }),

        getFileContentsRaw: jest.fn().mockImplementation(async (fileKey: string): Promise<string> => {
            if (!(fileKey in mockFiles)) {
                throw new NotFoundException(`File not found: ${fileKey}`);
            }

            try {
                return mockFiles[fileKey].content || '';
            } catch (error) {
                throw new InternalServerErrorException(`Error getting file contents: ${error.message}`);
            }
        }),

        listObjects: jest.fn().mockImplementation(async (
            prefix: string,
            maxKeys: number = 1000
        ): Promise<{ Key: string }[]> => {
            try {
                // Filtra os arquivos mockados pelo prefixo
                const matchingFiles = Object.keys(mockFiles)
                    .filter(key => key.startsWith(prefix))
                    .slice(0, maxKeys)
                    .map(key => ({ Key: key }));

                return matchingFiles;
            } catch (error) {
                throw new InternalServerErrorException(`Failed to list objects: ${error.message}`);
            }
        }),

        listObjectsPaginated: jest.fn().mockImplementation(async (
            prefix: string,
            maxKeys: number = 1000,
            continuationToken?: string,
        ): Promise<ListObjectsPaginatedResult> => {
            try {
                const allMatchingKeys = Object.keys(mockFiles)
                    .filter(key => key.startsWith(prefix));

                const startIndex = continuationToken
                    ? Number(continuationToken)
                    : 0;

                const pagedKeys = allMatchingKeys
                    .slice(startIndex, startIndex + maxKeys);

                const nextIndex = startIndex + maxKeys;
                const hasMore = nextIndex < allMatchingKeys.length;

                return {
                    objects: pagedKeys.map(key => ({ Key: key })),
                    isTruncated: hasMore,
                    nextContinuationToken: hasMore
                        ? String(nextIndex)
                        : null,
                };
            } catch (error) {
                throw new InternalServerErrorException(
                    `Failed to list objects: ${error.message}`,
                );
            }
        }),

        uploadBuffer: jest.fn().mockImplementation(async (
            fileKey: string,
            buffer: Buffer,
            contentType: string,
        ) => {
            mockFiles[fileKey] = {
                content: buffer.toString('utf-8'),
                contentType,
            };
        }),

        deleteObject: jest.fn().mockImplementation(async (fileKey: string) => {
            if (!(fileKey in mockFiles)) {
                throw new NotFoundException(`File not found: ${fileKey}`);
            }

            delete mockFiles[fileKey];
        }),

        copyObject: jest.fn().mockImplementation(async (
            sourceKey: string,
            targetKey: string,
        ) => {
            if (!(sourceKey in mockFiles)) {
                throw new NotFoundException(`File not found: ${sourceKey}`);
            }

            mockFiles[targetKey] = {
                ...mockFiles[sourceKey],
            };
        }),

        // Utility method to add mock files for testing
        _addMockFile: jest.fn().mockImplementation((
            fileKey: string,
            content?: string,
            contentType?: string,
            metadata?: any
        ) => {
            mockFiles[fileKey] = { content, contentType, metadata };
        }),

        // Utility method to clear mock files
        _clearMockFiles: jest.fn().mockImplementation(() => {
            mockFiles = {};
        }),
    };

    return mockService;
};