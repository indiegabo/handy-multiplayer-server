import { BadRequestException, ConflictException } from '@nestjs/common';

import { UploadGameImageUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/upload-game-image.usecase';
import { StorageService } from '../../../../../../../../../../src/modules/hms/modules/storage/services/storage.service';
import { MediaService } from '../../../../../../../../../../src/modules/hms/modules/media/services/media.service';
import { BetterLogger } from '../../../../../../../../../../src/modules/hms/modules/better-logger/better-logger.service';

describe('UploadGameImageUseCase', () => {
    let usecase: UploadGameImageUseCase;
    let storage: jest.Mocked<StorageService>;
    let mediaService: jest.Mocked<MediaService>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(() => {
        storage = {
            uploadBuffer: jest.fn().mockResolvedValue(undefined),
        } as any;
        mediaService = {
            findOneMediaByMetadataConditions: jest.fn(),
            finalizeUploadAndAttach: jest.fn(),
        } as any;
        logger = {
            setContext: jest.fn(),
            setMessagesColor: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;

        usecase = new UploadGameImageUseCase(storage as any, mediaService as any, logger as any);
    });

    it('uploads buffer and finalizes when no existing image', async () => {
        (mediaService.findOneMediaByMetadataConditions as jest.Mock).mockResolvedValue(undefined);
        (mediaService.finalizeUploadAndAttach as jest.Mock).mockResolvedValueOnce({ media: { id: 'mid' } });

        const params = {
            gameId: 'g1',
            buffer: Buffer.from('abc'),
            originalName: 'img.png',
            mimetype: 'image/png',
            size: 123,
            ratio: '16:9',
        } as any;

        const res = await usecase.execute(params);

        expect(storage.uploadBuffer).toHaveBeenCalledWith(
            expect.stringMatching(/^public\/games\/g1\/images\/.+\.png$/),
            expect.any(Buffer),
            'image/png',
        );
        expect(mediaService.finalizeUploadAndAttach).toHaveBeenCalledWith(
            expect.stringMatching(/^public\/games\/g1\/images\/.+\.png$/),
            expect.objectContaining({
                filename: 'img.png',
                mimetype: 'image/png',
                size: 123,
            }),
        );
        expect(res).toHaveProperty('media');
        expect(res).toHaveProperty('fileKey');
        expect(res.fileKey).toMatch(/^public\/games\/g1\/images\/.+\.png$/);
    });

    it('throws ConflictException when image with same ratio exists', async () => {
        (mediaService.findOneMediaByMetadataConditions as jest.Mock).mockResolvedValue({ id: 'exists' } as any);

        const params = {
            gameId: 'g1',
            buffer: Buffer.from('abc'),
            originalName: 'img.png',
            mimetype: 'image/png',
            size: 123,
            ratio: '16:9',
        } as any;

        await expect(usecase.execute(params)).rejects.toThrow(ConflictException);
        expect(storage.uploadBuffer).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when buffer missing', async () => {
        const params = {
            gameId: 'g1',
            buffer: null,
            originalName: 'img.png',
            mimetype: 'image/png',
            size: 123,
            ratio: '16:9',
        } as any;

        await expect(usecase.execute(params)).rejects.toThrow(BadRequestException);
    });
});
