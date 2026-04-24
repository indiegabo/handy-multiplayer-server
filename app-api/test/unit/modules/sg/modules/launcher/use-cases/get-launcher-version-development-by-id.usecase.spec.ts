import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    GetLauncherVersionDevelopmentByIdUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/get-launcher-version-development-by-id.usecase';

describe('GetLauncherVersionDevelopmentByIdUseCase', () => {
    let useCase: GetLauncherVersionDevelopmentByIdUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetLauncherVersionDevelopmentByIdUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<GetLauncherVersionDevelopmentByIdUseCase>(
            GetLauncherVersionDevelopmentByIdUseCase,
        );
        versionRepository = module.get(VersionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return development metadata when launcher version exists', async () => {
        const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';
        const development = {
            candidate: {
                channel: 'beta',
                branch: 'beta',
            },
        };

        versionRepository.findOne.mockResolvedValue({
            id: versionId,
            development,
        } as any);

        const result = await useCase.execute(versionId);

        expect(versionRepository.findOne).toHaveBeenCalledWith({
            where: {
                id: versionId,
                entity_type: 'Launcher',
            },
            select: [
                'id',
                'development',
            ],
        });
        expect(result).toEqual(development);
    });

    it('should return null when development metadata is absent', async () => {
        const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

        versionRepository.findOne.mockResolvedValue({
            id: versionId,
            development: null,
        } as any);

        const result = await useCase.execute(versionId);

        expect(result).toBeNull();
    });

    it('should throw NotFoundException when launcher version does not exist', async () => {
        const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute(versionId))
            .rejects
            .toBeInstanceOf(NotFoundException);
    });
});