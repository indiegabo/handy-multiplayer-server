import { S3Client, HeadObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { Test, TestingModule } from '@nestjs/testing';
import { StorageService } from '../../../../../../../src/modules/hms/modules/storage/services/storage.service';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

jest.mock('@aws-sdk/s3-request-presigner', () => ({
    getSignedUrl: jest.fn(),
}));

describe('StorageService', () => {
    let service: StorageService;
    let s3ClientMock: Partial<S3Client>;
    let loggerMock: Partial<BetterLogger>;

    const mockSend = jest.fn();

    beforeEach(async () => {
        s3ClientMock = {
            send: mockSend,
        };

        loggerMock = {
            error: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StorageService,
                { provide: 'S3_CLIENT', useValue: s3ClientMock },
                { provide: 'AWS_S3_BUCKET_NAME', useValue: 'test-bucket' },
                { provide: BetterLogger, useValue: loggerMock },
            ],
        }).compile();

        service = module.get(StorageService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('checkFileExists', () => {
        it('should return true if file exists', async () => {
            mockSend.mockResolvedValueOnce({});
            const result = await service.checkFileExists('file.txt');
            expect(result).toBe(true);
            expect(mockSend).toHaveBeenCalledWith(expect.any(HeadObjectCommand));
        });

        it('should return false if file not found', async () => {
            const error = new Error('Not found');
            error.name = 'NotFound';
            mockSend.mockRejectedValueOnce(error);
            const result = await service.checkFileExists('missing.txt');
            expect(result).toBe(false);
        });

        it('should throw if other error occurs', async () => {
            const error = new Error('Something else');
            mockSend.mockRejectedValueOnce(error);
            await expect(service.checkFileExists('fail.txt')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('getDownloadPreSignedUrl', () => {
        it('should return a valid signed URL dto', async () => {
            const signedUrl = 'https://example.com/signed-url';
            (getSignedUrl as jest.Mock).mockResolvedValue(signedUrl);

            const result = await service.getDownloadPreSignedUrl('file.txt', 600);
            expect(result.url).toBe(signedUrl);
            expect(result.method).toBe('GET');
            expect(result.file_key).toBe('file.txt');
            expect(result.bucket).toBe('test-bucket');
            expect(result.expires_at).toBeInstanceOf(Date);
        });

        it('should throw if getSignedUrl fails', async () => {
            (getSignedUrl as jest.Mock).mockRejectedValueOnce(new Error('fail'));
            await expect(service.getDownloadPreSignedUrl('file.txt')).rejects.toThrow(InternalServerErrorException);
        });
    });

    describe('generateUploadPreSignedUrl', () => {
        it('should return a signed URL dto with PUT method', async () => {
            const signedUrl = 'https://example.com/upload';
            (getSignedUrl as jest.Mock).mockResolvedValue(signedUrl);

            const result = await service.generateUploadPreSignedUrl('file.txt', 'text/plain', 3600, 5000);
            expect(result.url).toBe(signedUrl);
            expect(result.method).toBe('PUT');
            expect(result.content_type).toBe('text/plain');
            expect(result.size_limit).toBe(5000);
        });
    });

    describe('getFileContents', () => {
        it('should return parsed JSON from meta file', async () => {
            const fileContent = { foo: 'bar' };
            const readable = {
                transformToString: jest.fn().mockResolvedValueOnce(JSON.stringify(fileContent)),
            };

            mockSend
                .mockResolvedValueOnce({}) // checkFileExists
                .mockResolvedValueOnce({ Body: readable }); // GetObjectCommand

            const result = await service.getFileContents<{ foo: string }>('archive.zip');
            expect(result).toEqual(fileContent);
        });

        it('should throw NotFoundException if meta file does not exist', async () => {
            mockSend.mockRejectedValueOnce({ name: 'NotFound' });
            await expect(service.getFileContents('archive.zip')).rejects.toThrow(NotFoundException);
        });

        it('should throw InternalServerErrorException on other errors', async () => {
            mockSend
                .mockResolvedValueOnce({}) // checkFileExists
                .mockRejectedValueOnce(new Error('failed'));

            await expect(service.getFileContents('archive.zip')).rejects.toThrow(InternalServerErrorException);
        });
    });
});
