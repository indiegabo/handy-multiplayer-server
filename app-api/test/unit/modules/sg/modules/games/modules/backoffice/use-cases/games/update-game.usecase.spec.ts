import { NotFoundException } from '@nestjs/common';
import { UpdateGameUseCase } from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/games/update-game.usecase';
import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { GameAvailabilityService } from '@src/modules/sg/core/services/game-availability.service';
import { GameAvailability } from '@hms/shared-types';

describe('UpdateGameUseCase', () => {
    let useCase: UpdateGameUseCase;
    let gameRepository: jest.Mocked<GameRepository>;
    let gameAvailabilityService: jest.Mocked<GameAvailabilityService>;
    let transactionFn: jest.Mock;

    beforeEach(() => {
        transactionFn = jest.fn((cb) => cb({ findOne, save }));
        const findOne = jest.fn();
        const save = jest.fn();

        gameRepository = {
            manager: { transaction: transactionFn },
            findById: jest.fn(),
        } as any;

        gameAvailabilityService = {
            setAvailability: jest.fn(),
        } as any;

        useCase = new UpdateGameUseCase(gameRepository, gameAvailabilityService);
        (transactionFn as any).mockImplementation(async (cb: any) =>
            cb({ findOne, save }),
        );
        (gameRepository.manager as any).findOne = findOne;
        (gameRepository.manager as any).save = save;
    });

    it('throws NotFound when game does not exist', async () => {
        (gameRepository.manager.findOne as jest.Mock).mockResolvedValue(null);

        await expect(useCase.execute('g1', {} as any))
            .rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates provided fields and returns DTO', async () => {
        const game = { id: 'g2', name: 'Old', description: 'X' };
        (gameRepository.manager.findOne as jest.Mock).mockResolvedValue(game);
        (gameRepository.manager.save as jest.Mock).mockResolvedValue({
            ...game,
            name: 'New',
        });
        gameRepository.findById.mockResolvedValue({
            ...game,
            name: 'New',
        } as any);

        const result = await useCase.execute('g2', { name: 'New' } as any);

        expect(result).toEqual(expect.objectContaining({ id: 'g2', name: 'New' }));
    });

    it('routes availability updates to GameAvailabilityService', async () => {
        const game = {
            id: 'g3',
            name: 'Any',
            availability: GameAvailability.ComingSoon,
        };

        (gameRepository.manager.findOne as jest.Mock).mockResolvedValue(game);
        (gameRepository.manager.save as jest.Mock).mockResolvedValue(game);
        gameRepository.findById.mockResolvedValue({
            ...game,
            availability: GameAvailability.Unlisted,
        } as any);

        await useCase.execute('g3', {
            availability: GameAvailability.Unlisted,
        } as any);

        expect(gameAvailabilityService.setAvailability).toHaveBeenCalledWith(
            'g3',
            GameAvailability.Unlisted,
            {
                source: 'sg.backoffice.update-game',
            },
        );
    });
});
