import { NotFoundException } from '@nestjs/common';
import { DataSource, QueryRunner } from 'typeorm';

import { CreateGameUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/create-game.usecase';

import { ConnectionModuleRepository }
    from '@src/modules/sg/core/repositories/connection-module.repository';

import { GameAvailability }
    from '@hms/shared-types';

describe('CreateGameUseCase', () => {
    let useCase: CreateGameUseCase;

    let dataSource: jest.Mocked<DataSource>;
    let qr: jest.Mocked<QueryRunner>;

    beforeEach(() => {
        qr = {
            connect: jest.fn().mockResolvedValue(undefined),
            startTransaction: jest.fn().mockResolvedValue(undefined),
            commitTransaction: jest.fn().mockResolvedValue(undefined),
            rollbackTransaction: jest.fn().mockResolvedValue(undefined),
            release: jest.fn().mockResolvedValue(undefined),
            manager: {
                save: jest.fn(),
            },
        } as any;

        dataSource = {
            createQueryRunner: jest.fn().mockReturnValue(qr),
        } as any;

        useCase = new CreateGameUseCase(dataSource);
    });


    it('throws NotFound when some platforms do not exist', async () => {
        const payload = {
            name: 'N',
            description: 'D',
        } as any;

        (qr.manager.save as jest.Mock).mockRejectedValueOnce(new Error('not found'));

        await expect(useCase.execute(payload)).rejects.toThrow();

        expect(qr.rollbackTransaction).toHaveBeenCalled();
    });

    it('creates game with modules and metadata, then commits', async () => {
        const payload = {
            name: 'Game X',
            description: 'Desc',
            cover_url: 'http://img',
            type: 'some-type',
            availability: GameAvailability.ComingSoon,
        } as any;

        (qr.manager.save as jest.Mock).mockImplementation(async (game: any) => ({
            ...game,
            id: 'new-game-id',
        }));

        const result = await useCase.execute(payload);

        expect(qr.startTransaction).toHaveBeenCalled();
        expect(qr.manager.save).toHaveBeenCalledWith(
            expect.objectContaining({
                name: 'Game X',
            }),
        );

        expect(qr.commitTransaction).toHaveBeenCalled();
        expect(result).toEqual(
            expect.objectContaining({
                id: 'new-game-id',
                name: 'Game X',
            }),
        );
    });

    it('creates game without platforms and still initializes metadata', async () => {
        const payload = {
            name: 'Solo Game',
            description: 'No mods',
        } as any;
        (qr.manager.save as jest.Mock).mockResolvedValueOnce({
            id: 'solo',
            ...payload,
        });
        const result = await useCase.execute(payload);

        expect(qr.commitTransaction).toHaveBeenCalled();
        expect(result.id).toBe('solo');
    });

    it('rolls back when persistence fails', async () => {
        const payload = {
            name: 'Err Game',
            description: 'X',
            platforms: [],
        } as any;
        (qr.manager.save as jest.Mock).mockRejectedValueOnce(
            new Error('db error'),
        );

        await expect(useCase.execute(payload)).rejects.toThrow('db error');
        expect(qr.rollbackTransaction).toHaveBeenCalled();
        expect(qr.release).toHaveBeenCalled();
    });
});
