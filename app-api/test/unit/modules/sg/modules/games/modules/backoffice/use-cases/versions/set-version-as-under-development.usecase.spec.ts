import { BadRequestException } from '@nestjs/common';
import { SetVersionAsUnderDevelopmentUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/set-version-as-under-development.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { GameVersionState } from '@hms/shared-types';

describe('SetVersionAsUnderDevelopmentUseCase', () => {
    let useCase: SetVersionAsUnderDevelopmentUseCase;
    let repo: jest.Mocked<VersionRepository>;

    const gameId = '11111111-1111-1111-1111-111111111111';
    const versionId = '22222222-2222-2222-2222-222222222222';

    beforeEach(() => {
        repo = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<VersionRepository>;

        useCase = new SetVersionAsUnderDevelopmentUseCase(repo);
    });

    it('should reject when version does not exist', async () => {
        (repo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(useCase.execute(gameId, versionId)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should reject when version is not AwaitingDevelopmentApproval', async () => {
        (repo.findOne as jest.Mock).mockResolvedValue({ state: GameVersionState.Ready } as Version);

        await expect(useCase.execute(gameId, versionId)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should set version to UnderDevelopment when state allows', async () => {
        const existing: Partial<Version> = {
            id: versionId,
            semver: { raw: '1.2.0', major: 1, minor: 2, patch: 0 },
            state: GameVersionState.AwaitingDevelopmentApproval,
            is_current: false,
            is_prerelease: false,
        };

        const saved: Partial<Version> = {
            ...existing,
            state: GameVersionState.UnderDevelopment as unknown as number,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(existing as Version);
        (repo.save as jest.Mock).mockResolvedValue(saved as Version);

        const result = await useCase.execute(gameId, versionId);

        expect(repo.save).toHaveBeenCalled();
        expect(result.state).toBe(GameVersionState.UnderDevelopment);
        expect(result.id).toBe(versionId);
    });
});
