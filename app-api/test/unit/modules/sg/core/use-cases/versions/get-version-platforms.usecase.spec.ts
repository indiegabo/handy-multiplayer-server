import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { GetVersionPlatformsUseCase } from '../../../../../../../src/modules/sg/modules/games/modules/runtime/use-cases/get-version-platforms.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { ConnectionPlatform } from '@hms/shared-types';

describe('GetVersionPlatformsUseCase', () => {
    let useCase: GetVersionPlatformsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = { findOne: jest.fn() };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionPlatformsUseCase,
                { provide: VersionRepository, useValue: mockVersionRepository },
            ],
        }).compile();

        useCase = module.get<GetVersionPlatformsUseCase>(GetVersionPlatformsUseCase);
        versionRepository = module.get(VersionRepository);
    });

    it('should return empty array when runtime has no platforms', async () => {
        versionRepository.findOne.mockResolvedValue({ id: 'v1', runtime: null } as any);
        const result = await useCase.execute('v1');
        expect(result).toEqual([]);
    });

    it('should return platforms when present', async () => {
        versionRepository.findOne.mockResolvedValue({ id: 'v1', runtime: { platforms: [ConnectionPlatform.Twitch] } } as any);
        const result = await useCase.execute('v1');
        expect(result).toEqual([ConnectionPlatform.Twitch]);
    });

    it('should throw NotFoundException when version missing', async () => {
        versionRepository.findOne.mockResolvedValue(null);
        await expect(useCase.execute('nope')).rejects.toThrow(NotFoundException);
    });
});
