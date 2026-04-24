import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

import { ReleaseVersionUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/release-version.usecase';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { VersionRepository }
    from '@src/modules/sg/core/repositories/version.repository';
import { GameVersionState } from '@hms/shared-types';

describe('ReleaseVersionUseCase', () => {
    let useCase: ReleaseVersionUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let versionRepository: jest.Mocked<VersionRepository>;
    let dataSource: jest.Mocked<DataSource>;
    let qr: jest.Mocked<QueryRunner>;

    beforeEach(() => {
        gameRepository = { findOne: jest.fn() } as any;
        versionRepository = {
            findOne: jest.fn(),
            findOneBySemverRaw: jest.fn(),
        } as any;

        qr = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: {
                save: jest.fn().mockResolvedValue(undefined),
            },
        } as any;

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(qr),
        } as any;

        useCase = new ReleaseVersionUseCase(
            gameRepository,
            versionRepository,
            dataSource,
        );
    });

    it('throws when game does not exist', async () => {
        const gameId = 'g-missing';
        const semver = '1.0.0';

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
        const semver = '1.0.0';

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
        expect(qr.startTransaction).not.toHaveBeenCalled();
    });

    it('throws when version state is not Ready', async () => {
        const gameId = 'g-2';
        const semver = '2.0.0';

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValueOnce({
            semver,
            state: GameVersionState.Homologation,
        } as any);

        await expect(useCase.execute(gameId, semver))
            .rejects
            .toBeInstanceOf(BadRequestException);

        expect(qr.startTransaction).not.toHaveBeenCalled();
    });

    it('sets version to Released and commits transaction', async () => {
        const gameId = 'g-3';
        const semver = '3.1.0';
        const version = {
            id: 'v-3',
            semver,
            state: GameVersionState.Ready,
            released_at: null as Date | null,
        } as any;

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValueOnce(version);

        const result = await useCase.execute(gameId, semver);

        expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
        expect(qr.connect).toHaveBeenCalled();
        expect(qr.startTransaction).toHaveBeenCalled();

        expect(qr.manager.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'v-3',
                state: GameVersionState.Released,
                released_at: expect.any(Date),
            }),
        );

        expect(qr.commitTransaction).toHaveBeenCalled();
        expect(qr.release).toHaveBeenCalled();

        expect(result).toEqual(
            expect.objectContaining({
                id: 'v-3',
                semver: '3.1.0',
            }),
        );
    });

    it('rolls back on error', async () => {
        const gameId = 'g-4';
        const semver = '4.0.0';
        const version = {
            id: 'v-4',
            semver,
            state: GameVersionState.Ready,
        } as any;

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOneBySemverRaw.mockResolvedValueOnce(version);

        (qr.manager.save as jest.Mock).mockRejectedValueOnce(
            new Error('db error'),
        );

        await expect(useCase.execute(gameId, semver))
            .rejects
            .toThrow('db error');

        expect(qr.startTransaction).toHaveBeenCalled();
        expect(qr.rollbackTransaction).toHaveBeenCalled();
        expect(qr.release).toHaveBeenCalled();
    });
});
