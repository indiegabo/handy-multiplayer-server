import {
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { SetVersionAsReadyUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/set-version-as-ready.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { VersionRepository }
    from '@src/modules/sg/core/repositories/version.repository';
import { DataSource, QueryRunner } from 'typeorm';
import { GameVersionState } from '@hms/shared-types';

describe('SetVersionAsReadyUseCase', () => {
    let useCase: SetVersionAsReadyUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let versionRepository: jest.Mocked<VersionRepository>;
    let dataSource: jest.Mocked<DataSource>;
    let queryRunner: jest.Mocked<QueryRunner>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
        } as any;

        versionRepository = {
            findOne: jest.fn(),
        } as any;

        queryRunner = {
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
            createQueryRunner: jest.fn().mockReturnValue(queryRunner),
        } as any;

        useCase = new SetVersionAsReadyUseCase(
            gameRepository,
            versionRepository,
            dataSource,
        );
    });

    it('throws when game does not exist', async () => {
        const gameId = 'g-missing';
        const versionId = 'v-1';

        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId, versionId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(versionRepository.findOne).not.toHaveBeenCalled();
    });

    it('throws when version does not exist', async () => {
        const gameId = 'g-1';
        const versionId = 'v-missing';

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId, versionId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(versionRepository.findOne).toHaveBeenCalledWith({
            where: { id: versionId, entity_type: 'Game', entity_id: gameId },
        });
        expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('throws when version is not WaitingForApproval', async () => {
        const gameId = 'g-2';
        const versionId = 'v-2';

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOne.mockResolvedValueOnce({
            id: versionId,
            semver: '1.0.0',
            state: GameVersionState.Ready,
        } as any);

        await expect(useCase.execute(gameId, versionId))
            .rejects
            .toBeInstanceOf(BadRequestException);

        expect(queryRunner.startTransaction).not.toHaveBeenCalled();
    });

    it('sets version as Ready and commits transaction', async () => {
        const gameId = 'g-3';
        const versionId = 'v-3';

        const version = {
            id: versionId,
            semver: '1.2.0',
            state: GameVersionState.Homologation,
            released_at: null as Date | null,
        } as any;

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOne.mockResolvedValueOnce(version);

        await expect(useCase.execute(gameId, versionId))
            .resolves
            .toEqual(
                expect.objectContaining({
                    id: versionId,
                    semver: '1.2.0',
                    // Ready will be set inside the use case
                }),
            );

        expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
        expect(queryRunner.connect).toHaveBeenCalledTimes(1);
        expect(queryRunner.startTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.manager.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: versionId,
                state: GameVersionState.Ready,
                released_at: expect.any(Date),
            }),
        );
        expect(queryRunner.commitTransaction).toHaveBeenCalledTimes(1);
        expect(queryRunner.release).toHaveBeenCalledTimes(1);
    });

    it('rolls back transaction on error', async () => {
        const gameId = 'g-4';
        const versionId = 'v-4';

        const version = {
            id: versionId,
            semver: '2.0.0',
            state: GameVersionState.Homologation,
        } as any;

        gameRepository.findOne.mockResolvedValueOnce({ id: gameId } as any);
        versionRepository.findOne.mockResolvedValueOnce(version);

        (queryRunner.manager.save as jest.Mock).mockRejectedValueOnce(
            new Error('db error'),
        );

        await expect(useCase.execute(gameId, versionId))
            .rejects
            .toThrow('db error');

        expect(queryRunner.startTransaction).toHaveBeenCalled();
        expect(queryRunner.rollbackTransaction).toHaveBeenCalled();
        expect(queryRunner.release).toHaveBeenCalled();
    });
});
