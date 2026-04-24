import { BadRequestException, NotFoundException } from '@nestjs/common';

import { RemoveGameImageUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/remove-game-image.usecase';
import { StorageService } from '../../../../../../../../../../src/modules/hms/modules/storage/services/storage.service';
import { MediaService } from '../../../../../../../../../../src/modules/hms/modules/media/services/media.service';
import { BetterLogger } from '../../../../../../../../../../src/modules/hms/modules/better-logger/better-logger.service';

describe('RemoveGameImageUseCase', () => {
    let usecase: RemoveGameImageUseCase;
    let storage: jest.Mocked<StorageService>;
    let mediaService: jest.Mocked<MediaService>;
    let logger: jest.Mocked<BetterLogger>;

    beforeEach(() => {
        storage = {
            deleteObjectIfExists: jest.fn().mockResolvedValue(true),
        } as any;

        mediaService = {
            findOneMediaByMetadataConditions: jest.fn(),
            deleteMediaById: jest.fn().mockResolvedValue(undefined),
        } as any;

        logger = {
            setContext: jest.fn(),
            setMessagesColor: jest.fn(),
            log: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            debug: jest.fn(),
        } as any;

        usecase = new RemoveGameImageUseCase(
            storage as any,
            mediaService as any,
            logger as any,
        );
    });

    it('removes image from storage and media registry', async () => {
        (mediaService.findOneMediaByMetadataConditions as jest.Mock)
            .mockResolvedValue({
                id: 'media-1',
                metadata: {
                    file_key: '/public/games/g1/images/test.png',
                },
            });

        const result = await usecase.execute({
            gameId: 'g1',
            ratio: '16:9',
        });

        expect(storage.deleteObjectIfExists).toHaveBeenCalledWith(
            '/public/games/g1/images/test.png',
        );
        expect(mediaService.deleteMediaById).toHaveBeenCalledWith('media-1');
        expect(result).toEqual({
            deleted: true,
            media_id: 'media-1',
            file_key: '/public/games/g1/images/test.png',
            ratio: '16:9',
        });
    });

    it('throws NotFoundException when image does not exist for ratio', async () => {
        (mediaService.findOneMediaByMetadataConditions as jest.Mock)
            .mockResolvedValue(undefined);

        await expect(
            usecase.execute({ gameId: 'g1', ratio: '2:3' }),
        ).rejects.toThrow(NotFoundException);

        expect(storage.deleteObjectIfExists).not.toHaveBeenCalled();
        expect(mediaService.deleteMediaById).not.toHaveBeenCalled();
    });

    it('throws BadRequestException when metadata.file_key is missing', async () => {
        (mediaService.findOneMediaByMetadataConditions as jest.Mock)
            .mockResolvedValue({
                id: 'media-2',
                metadata: {},
            });

        await expect(
            usecase.execute({ gameId: 'g1', ratio: '16:9' }),
        ).rejects.toThrow(BadRequestException);

        expect(storage.deleteObjectIfExists).not.toHaveBeenCalled();
        expect(mediaService.deleteMediaById).not.toHaveBeenCalled();
    });
});
