import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UpdateVersionRuntimePlatformsUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/update-version-runtime-platforms.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { ConnectionPlatform } from '@hms/shared-types';

describe('UpdateVersionRuntimePlatformsUseCase', () => {
    let useCase: UpdateVersionRuntimePlatformsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = { findOne: jest.fn(), save: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateVersionRuntimePlatformsUseCase,
                { provide: VersionRepository, useValue: mockVersionRepository },
            ],
        }).compile();

        useCase = module.get<UpdateVersionRuntimePlatformsUseCase>(UpdateVersionRuntimePlatformsUseCase);
        versionRepository = module.get(VersionRepository);
    });

    it('should update platforms when version exists', async () => {
        const version = { id: 'v1', runtime: {} } as any;
        versionRepository.findOne.mockResolvedValue(version);
        versionRepository.save.mockResolvedValue({ id: 'v1', runtime: { platforms: [ConnectionPlatform.Twitch] } } as any);

        const result = await useCase.execute('game-id', 'v1', [ConnectionPlatform.Twitch]);

        expect(result).toEqual({ version_id: 'v1', platforms: [ConnectionPlatform.Twitch] });
        expect(versionRepository.findOne).toHaveBeenCalledWith({ where: { id: 'v1' } });
        expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when version missing', async () => {
        versionRepository.findOne.mockResolvedValue(null);
        await expect(useCase.execute('g', 'v2', [ConnectionPlatform.Twitch])).rejects.toThrow(NotFoundException);
    });
});
