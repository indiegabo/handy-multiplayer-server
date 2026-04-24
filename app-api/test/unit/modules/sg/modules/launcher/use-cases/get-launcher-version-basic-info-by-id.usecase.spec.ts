import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { LauncherVersionState } from '@hms/shared-types';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    LauncherReleaseChannel,
} from '@src/modules/sg/modules/launcher/dto/create-launcher-candidate-version.dto';
import {
    GetLauncherVersionBasicInfoByIdUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/get-launcher-version-basic-info-by-id.usecase';

describe('GetLauncherVersionBasicInfoByIdUseCase', () => {
    let useCase: GetLauncherVersionBasicInfoByIdUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetLauncherVersionBasicInfoByIdUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOne: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<GetLauncherVersionBasicInfoByIdUseCase>(
            GetLauncherVersionBasicInfoByIdUseCase,
        );
        versionRepository = module.get(VersionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return basic info when launcher version exists', async () => {
        const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

        versionRepository.findOne.mockResolvedValue({
            id: versionId,
            entity_type: 'Launcher',
            entity_id: 'd68e1da8-2bc6-4c61-a273-a567849b58b0',
            semver: {
                raw: '2.5.0',
                major: 2,
                minor: 5,
                patch: 0,
            },
            state: LauncherVersionState.Released,
            is_current: true,
            is_prerelease: false,
            development: {
                candidate: {
                    channel: LauncherReleaseChannel.Latest,
                },
            },
            created_at: new Date('2026-04-14T21:00:00.000Z'),
            updated_at: new Date('2026-04-14T21:10:00.000Z'),
            released_at: new Date('2026-04-14T21:20:00.000Z'),
        } as any);

        const result = await useCase.execute(versionId);

        expect(versionRepository.findOne).toHaveBeenCalledWith({
            where: {
                id: versionId,
                entity_type: 'Launcher',
            },
        });
        expect(result).toEqual(expect.objectContaining({
            id: versionId,
            state: LauncherVersionState.Released,
            channel: LauncherReleaseChannel.Latest,
            is_current: true,
        }));
    });

    it('should throw NotFoundException when launcher version does not exist', async () => {
        const versionId = '23f17af2-c182-4349-9f8a-bf97fe105095';

        versionRepository.findOne.mockResolvedValue(null);

        await expect(useCase.execute(versionId))
            .rejects
            .toBeInstanceOf(NotFoundException);
    });
});