import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { GetVersionInitSettingsUseCase } from '../../../../../../../src/modules/sg/modules/games/modules/runtime/use-cases/get-version-init-settings.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';

describe('GetVersionInitSettingsUseCase', () => {
    let useCase: GetVersionInitSettingsUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const mockVersionRepository = {
            findOne: jest.fn(),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetVersionInitSettingsUseCase,
                {
                    provide: VersionRepository,
                    useValue: mockVersionRepository,
                },
            ],
        }).compile();

        useCase = module.get<GetVersionInitSettingsUseCase>(
            GetVersionInitSettingsUseCase,
        );
        versionRepository = module.get(VersionRepository);
    });

    it('should return empty array when runtime has no init_settings', async () => {
        versionRepository.findOne.mockResolvedValue({
            id: 'v1',
            runtime: null,
        } as any);

        const result = await useCase.execute('v1');

        expect(result).toEqual([]);
    });

    it('should return init_settings when present', async () => {
        const initSettings = [
            {
                metadata: {
                    id: 'default',
                    order: 1,
                    display_name: 'Default',
                },
                fields: {
                    enabled: true,
                },
            },
        ];

        versionRepository.findOne.mockResolvedValue({
            id: 'v1',
            runtime: {
                init_settings: initSettings,
            },
        } as any);

        const result = await useCase.execute('v1');

        expect(result).toEqual(initSettings);
    });

    it('should return empty array when runtime init_settings is not an array', async () => {
        versionRepository.findOne.mockResolvedValue({
            id: 'v1',
            runtime: {
                init_settings: {
                    window: {
                        background: true,
                    },
                },
            },
        } as any);

        const result = await useCase.execute('v1');

        expect(result).toEqual([]);
    });

    it('should throw NotFoundException when version is missing', async () => {
        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute('missing-version')).rejects.toThrow(
            NotFoundException,
        );
    });
});
