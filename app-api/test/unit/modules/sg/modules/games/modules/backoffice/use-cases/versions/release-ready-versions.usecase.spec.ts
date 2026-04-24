import { NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';
import { Model } from 'mongoose';

import { ReleaseReadyVersionsUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/versions/release-ready-versions.usecase';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { VersionRepository }
    from '@src/modules/sg/core/repositories/version.repository';
import { GameVersionState } from '@hms/shared-types';

describe('ReleaseReadyVersionsUseCase', () => {
    let useCase: ReleaseReadyVersionsUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let versionRepository: jest.Mocked<VersionRepository>;
    let dataSource: jest.Mocked<DataSource>;
    let qr: jest.Mocked<QueryRunner>;
    let gameMetadataModel: jest.Mocked<Partial<Model<any>>> & {
        findOneAndUpdate: jest.Mock;
    };

    beforeEach(() => {
        gameRepository = { findOne: jest.fn() } as any;
        versionRepository = {
            find: jest.fn(),
            findCurrent: jest.fn(),
        } as any;

        qr = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: {
                save: jest.fn().mockResolvedValue(undefined),
                update: jest.fn().mockResolvedValue(undefined),
            },
        } as any;

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(qr),
        } as any;

        useCase = new ReleaseReadyVersionsUseCase(
            gameRepository,
            versionRepository,
            dataSource,
        );
    });

    it('throws NotFound when game does not exist', async () => {
        gameRepository.findOne.mockResolvedValueOnce(null);

        const result = await useCase.execute('missing');
        expect(result.success).toBe(false);
        expect(typeof result.errorMessage).toBe('string');
    });

    it('returns success with empty versions when nothing to release', async () => {
        gameRepository.findOne.mockResolvedValueOnce({ id: 'g1', name: 'G' } as any);
        versionRepository.findCurrent.mockResolvedValueOnce(null);
        versionRepository.find.mockResolvedValueOnce([]);

        const result = await useCase.execute('g1');

        expect(result.success).toBe(true);
        expect(result.versions).toEqual([]);
        expect(qr.startTransaction).not.toHaveBeenCalled();
    });

    it('releases ready versions when no current exists', async () => {
        gameRepository.findOne.mockResolvedValueOnce({ id: 'g2', name: 'G2' } as any);
        versionRepository.findCurrent.mockResolvedValueOnce(null);
        versionRepository.find.mockResolvedValueOnce([
            { id: 'v1', semver: { raw: '1.0.0' }, state: GameVersionState.Ready } as any,
            { id: 'v2', semver: { raw: '1.1.0' }, state: GameVersionState.Ready } as any,
        ]);

        const result = await useCase.execute('g2');

        expect(dataSource.createQueryRunner).toHaveBeenCalledTimes(1);
        expect(qr.startTransaction).toHaveBeenCalledTimes(1);

        // Latest should be current (1.1.0)
        expect(qr.manager.update).toHaveBeenCalledWith(
            expect.any(Function),
            { entity_type: 'Game', entity_id: 'g2' },
            { is_current: false },
        );
        expect(qr.manager.save).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'v2', is_current: true }),
        );

        expect(result.success).toBe(true);
        expect(result.versions).toHaveLength(2);
    });

    it('releases only versions newer than current', async () => {
        gameRepository.findOne.mockResolvedValueOnce({ id: 'g3' } as any);
        versionRepository.findCurrent.mockResolvedValueOnce({
            id: 'vc',
            semver: { raw: '1.0.1' },
            state: GameVersionState.Released,
            is_current: true,
        } as any);
        versionRepository.find.mockResolvedValueOnce([
            { id: 'v1', semver: { raw: '1.0.0' }, state: GameVersionState.Ready } as any,
            { id: 'v2', semver: { raw: '1.0.2' }, state: GameVersionState.Ready } as any,
        ]);

        const result = await useCase.execute('g3');

        // Should release only v2 (1.0.2)
        expect(qr.manager.save).toHaveBeenCalledWith(
            expect.objectContaining({ id: 'v2', state: GameVersionState.Released }),
        );
        expect(qr.manager.save).not.toHaveBeenCalledWith(
            expect.objectContaining({ id: 'v1' }),
        );
        expect(result.success).toBe(true);
        expect(result.versions).toHaveLength(1);
        expect(result.versions[0].id).toBe('v2');
    });

    it('rolls back and returns failure on transaction error', async () => {
        gameRepository.findOne.mockResolvedValueOnce({ id: 'g4' } as any);
        versionRepository.findCurrent.mockResolvedValueOnce(null);
        versionRepository.find.mockResolvedValueOnce([
            { id: 'v1', semver: '1.0.0', state: GameVersionState.Ready } as any,
        ]);

        (qr.manager.save as jest.Mock).mockRejectedValueOnce(new Error('db error'));

        const result = await useCase.execute('g4');

        expect(qr.startTransaction).toHaveBeenCalled();
        expect(qr.rollbackTransaction).toHaveBeenCalled();
        expect(result.success).toBe(false);
        expect(result.errorMessage).toBe('db error');
    });
});
