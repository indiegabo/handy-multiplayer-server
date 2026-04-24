import { BadRequestException } from '@nestjs/common';
import { RevertVersionFromHomologationUseCase } from '@src/modules/sg/modules/games/modules/backoffice/use-cases/versions/revert-version-from-homologation.usecase';
import { VersionRepository } from '@src/modules/sg/core/repositories/version.repository';
import { Version } from '@src/modules/sg/core/entities/version.entity';
import { GameVersionState } from '@hms/shared-types';

/**
 * Unit tests for `RevertVersionFromHomologationUseCase`.
 *
 * Verifies the state transition rules and persistence interactions
 * when attempting to move a version from `Homologation` back to
 * `UnderDevelopment`.
 */
describe('RevertVersionFromHomologationUseCase', () => {
    let useCase: RevertVersionFromHomologationUseCase;
    let repo: jest.Mocked<VersionRepository>;

    // Stable UUIDs used as test fixtures for game and version.
    const gameId =
        '11111111-1111-1111-1111-111111111111';
    const versionId =
        '22222222-2222-2222-2222-222222222222';

    beforeEach(() => {
        // Create a lightweight mocked repository implementing only the
        // methods required by the use case under test.
        repo = {
            findOne: jest.fn(),
            save: jest.fn(),
        } as unknown as jest.Mocked<VersionRepository>;

        useCase = new RevertVersionFromHomologationUseCase(repo);
    });

    it('throws BadRequestException when the version is not found', async () => {
        // Simulate repository returning no row for the requested
        // version.
        (repo.findOne as jest.Mock).mockResolvedValue(null);

        await expect(
            useCase.execute(gameId, versionId),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequestException when version is not in Homologation state', async () => {
        // Repository returns a version in a different state (e.g.
        // UnderDevelopment).
        (repo.findOne as jest.Mock).mockResolvedValue(
            { state: GameVersionState.UnderDevelopment } as Version,
        );

        await expect(
            useCase.execute(gameId, versionId),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('persists UnderDevelopment state when current state is Homologation', async () => {
        // Arrange: repository returns an entity currently in Homologation.
        const existing: Partial<Version> = {
            id: versionId,
            semver: {
                raw: '1.0.0',
                major: 1,
                minor: 0,
                patch: 0,
            },
            state: GameVersionState.Homologation,
        };

        (repo.findOne as jest.Mock).mockResolvedValue(
            existing as Version,
        );

        // Simulate save returning the saved entity (echo behavior).
        (repo.save as jest.Mock).mockImplementation(
            (v) => Promise.resolve(v),
        );

        // Act: execute the use case
        const result = await useCase.execute(
            gameId,
            versionId,
        );

        // Assert: state is changed and repository.save was invoked.
        expect(result.state).toBe(
            GameVersionState.UnderDevelopment,
        );
        expect(repo.save).toHaveBeenCalled();
    });
});
