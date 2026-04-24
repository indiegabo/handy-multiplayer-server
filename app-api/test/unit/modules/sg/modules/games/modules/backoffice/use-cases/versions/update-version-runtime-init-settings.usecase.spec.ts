import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import {
    UpdateVersionRuntimeInitSettingsUseCase,
} from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/update-version-runtime-init-settings.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';

describe('UpdateVersionRuntimeInitSettingsUseCase', () => {
    let useCase: UpdateVersionRuntimeInitSettingsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = {
            findOne: jest.fn(),
            save: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                UpdateVersionRuntimeInitSettingsUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepository,
                },
            ],
        }).compile();

        useCase = module.get<UpdateVersionRuntimeInitSettingsUseCase>(
            UpdateVersionRuntimeInitSettingsUseCase,
        );
        versionRepository = module.get(VersionRepository);
    });

    it('should update init settings when version exists', async () => {
        const version = {
            id: 'v1',
            runtime: {},
        } as any;
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    max_players: 4,
                },
            },
        ];

        versionRepository.findOne.mockResolvedValue(version);
        versionRepository.save.mockResolvedValue({
            id: 'v1',
            runtime: {
                init_settings: initSettings,
            },
        } as any);

        const result = await useCase.execute('game-id', 'v1', initSettings);

        expect(result).toEqual({
            version_id: 'v1',
            init_settings: initSettings,
        });
        expect(versionRepository.findOne).toHaveBeenCalledWith({
            where: { id: 'v1' },
        });
        expect(versionRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException when version is missing', async () => {
        versionRepository.findOne.mockResolvedValue(null);

        await expect(
            useCase.execute('game-id', 'v2', []),
        ).rejects.toThrow(NotFoundException);
    });
});
