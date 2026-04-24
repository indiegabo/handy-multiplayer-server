import { BadRequestException } from '@nestjs/common';
import { SetVersionAsCanceledUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/set-version-as-canceled.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { GameVersionState } from '@hms/shared-types';

describe('SetVersionAsCanceledUseCase', () => {
    let useCase: SetVersionAsCanceledUseCase;
    let repo: jest.Mocked<VersionRepository>;

    const gameId = '11111111-1111-1111-1111-111111111111';
    const versionId = '22222222-2222-2222-2222-222222222222';

    beforeEach(() => {
        repo = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<VersionRepository>;

        useCase = new SetVersionAsCanceledUseCase(repo);
    });

    it('should reject when version does not exist', async () => {
        (repo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(useCase.execute(gameId, versionId)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should reject when version is in Released/Rejected/Deprecated', async () => {
        (repo.findOne as jest.Mock).mockResolvedValue({ state: GameVersionState.Released } as Version);

        await expect(useCase.execute(gameId, versionId)).rejects.toBeInstanceOf(
            BadRequestException,
        );
    });

    it('should cancel version when state allows', async () => {
        const existing: Partial<Version> = {
            id: versionId,
            semver: { raw: '1.2.3', major: 1, minor: 2, patch: 3 },
            state: GameVersionState.UnderDevelopment,
            is_current: false,
            is_prerelease: false,
        };

        const saved: Partial<Version> = {
            ...existing,
            state: GameVersionState.Canceled as unknown as number,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(existing as Version);
        (repo.save as jest.Mock).mockResolvedValue(saved as Version);

        const result = await useCase.execute(gameId, versionId);

        expect(repo.save).toHaveBeenCalled();
        expect(result.state).toBe(GameVersionState.Canceled);
        expect(result.id).toBe(versionId);
    });
});
