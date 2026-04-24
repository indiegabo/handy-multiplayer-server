import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import {
    LauncherVersionState,
} from '@hms/shared-types';
import { Launcher } from '@src/modules/sg/core/entities/launcher.entity';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import {
    GetLauncherVersionEndUserChangelogBySemverUseCase,
} from '@src/modules/sg/modules/launcher/use-cases/get-launcher-version-end-user-changelog-by-semver.usecase';

describe('GetLauncherVersionEndUserChangelogBySemverUseCase', () => {
    let useCase: GetLauncherVersionEndUserChangelogBySemverUseCase;
    let versionRepository: jest.Mocked<VersionRepository>;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                GetLauncherVersionEndUserChangelogBySemverUseCase,
                {
                    provide: VersionRepository,
                    useValue: {
                        findOneByEntitySemverRawAndStates: jest.fn(),
                    },
                },
            ],
        }).compile();

        useCase = module.get<GetLauncherVersionEndUserChangelogBySemverUseCase>(
            GetLauncherVersionEndUserChangelogBySemverUseCase,
        );

        versionRepository = module.get(VersionRepository);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return changelog from notes.end_user_changelog', async () => {
        versionRepository.findOneByEntitySemverRawAndStates
            .mockResolvedValue({
                id: 'version-1',
                entity_type: Launcher.name,
                semver: {
                    raw: '1.0.0-alpha.19',
                    major: 1,
                    minor: 0,
                    patch: 0,
                    prerelease: 'alpha.19',
                },
                state: LauncherVersionState.Released,
                notes: {
                    end_user_changelog: '## Patch Notes\n- Fixed startup race',
                },
            } as any);

        const result = await useCase.execute('1.0.0-alpha.19');

        expect(versionRepository.findOneByEntitySemverRawAndStates)
            .toHaveBeenCalledWith(
                Launcher.name,
                '1.0.0-alpha.19',
                [
                    LauncherVersionState.Released,
                    LauncherVersionState.Deprecated,
                ],
            );

        expect(result).toEqual({
            semver_raw: '1.0.0-alpha.19',
            end_user_changelog: '## Patch Notes\n- Fixed startup race',
        });
    });

    it('should fallback to notes string when notes is legacy text', async () => {
        versionRepository.findOneByEntitySemverRawAndStates
            .mockResolvedValue({
                id: 'version-2',
                entity_type: Launcher.name,
                semver: {
                    raw: '1.0.0',
                    major: 1,
                    minor: 0,
                    patch: 0,
                },
                state: LauncherVersionState.Released,
                notes: 'Legacy changelog text',
            } as any);

        const result = await useCase.execute('1.0.0');

        expect(result).toEqual({
            semver_raw: '1.0.0',
            end_user_changelog: 'Legacy changelog text',
        });
    });

    it('should throw NotFoundException when semver is not public', async () => {
        versionRepository.findOneByEntitySemverRawAndStates
            .mockResolvedValue(null);

        await expect(useCase.execute('9.9.9')).rejects.toThrow(
            NotFoundException,
        );
    });
});
