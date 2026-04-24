// sg/modules/games/backoffice/use-cases/set-current-version.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { SetCurrentVersionUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/set-current-version.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { VersionRepository }
    from '@src/modules/sg/core/repositories/version.repository';

describe('SetCurrentVersionUseCase', () => {
    let useCase: SetCurrentVersionUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let versionRepository: jest.Mocked<VersionRepository>;
    let gameMetadataModel: any; // Mongoose model mock (partial)

    beforeEach(() => {
        gameRepository = { findOne: jest.fn() } as any;
        versionRepository = {
            findOne: jest.fn(),
            findOneBySemverRaw: jest.fn(),
            setAsCurrentVersion: jest.fn(),
        } as any;

        useCase = new SetCurrentVersionUseCase(
            gameRepository,
            versionRepository,
        );
    });

    it('throws when game does not exist', async () => {
        const gameId = 'g-missing';
        const semver = '1.2.3';

        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId, semver))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(versionRepository.findOneBySemverRaw).not.toHaveBeenCalled();
    });

    it('throws when version does not exist', async () => {
        const gameId = 'g-1';
        const semver = '9.9.9';

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId, semver))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(versionRepository.findOneBySemverRaw).toHaveBeenCalledWith(
            'Game',
            gameId,
            semver,
        );
        expect(versionRepository.setAsCurrentVersion).not.toHaveBeenCalled();
    });

    it('sets version as current and syncs Mongo, then returns DTO', async () => {
        const gameId = 'g-2';
        const semver = '1.0.1';

        const version = { id: 'v-1', semver } as any;
        const versionUpdated = { id: 'v-1', semver, is_current: true } as any;

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValueOnce(version);
        versionRepository.findOne.mockResolvedValueOnce(versionUpdated); // final fetch

        versionRepository.setAsCurrentVersion.mockResolvedValueOnce(undefined);

        const result = await useCase.execute(gameId, semver);

        expect(versionRepository.setAsCurrentVersion).toHaveBeenCalledWith(
            'Game',
            gameId,
            'v-1',
        );

        expect(versionRepository.findOne).toHaveBeenLastCalledWith({
            where: { id: 'v-1' },
        });

        expect(result).toEqual(
            expect.objectContaining({
                id: 'v-1',
                semver: '1.0.1',
                is_current: true,
            }),
        );
    });
});
