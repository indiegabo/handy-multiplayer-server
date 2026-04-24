// sg/modules/games/backoffice/use-cases/create-management-token.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { CreateManagementTokenUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/create-management-token.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { Game }
    from '@src/modules/sg/core/entities/game.entity';
import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';
import { GMTCreationResponseDTO }
    from '@sg-module/modules/games/dtos/game-management-token.dto';

describe('CreateManagementTokenUseCase', () => {
    let useCase: CreateManagementTokenUseCase;

    let gameRepository: jest.Mocked<GameRepository>;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
        } as unknown as jest.Mocked<GameRepository>;

        managementTokenRepository = {
            createForGame: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new CreateManagementTokenUseCase(
            gameRepository,
            managementTokenRepository,
        );
    });

    it('should throw NotFoundException when game does not exist', async () => {
        const gameId = 'missing';
        gameRepository.findOne.mockResolvedValueOnce(null);

        await expect(useCase.execute(gameId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(managementTokenRepository.createForGame)
            .not
            .toHaveBeenCalled();
    });

    it('should create a token for the game and return DTO', async () => {
        const gameId = 'game-1';
        const game = { id: gameId, name: 'Test Game' } as Game;

        gameRepository.findOne.mockResolvedValueOnce(game);

        const created = {
            id: 'gmt-1',
            game_id: gameId,
            token: 'aaaabbbbccccddddeeee',
            created_at: new Date('2025-01-10T10:00:00Z'),
            revoked_at: null,
            deleted_at: null,
        };

        managementTokenRepository.createForGame
            .mockResolvedValueOnce(created as any);

        const result = await useCase.execute(gameId, /* payload? */ undefined);

        expect(result).toBeInstanceOf(GMTCreationResponseDTO);
        expect(result.id).toBe('gmt-1');
        expect(result.game_id).toBe(gameId);
        expect(result.token).toBe('aaaabbbbccccddddeeee');
        expect(result.revoked_at).toBeNull();

        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.createForGame)
            .toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.createForGame)
            .toHaveBeenCalledWith(game, [], undefined, undefined);
    });

    it('should ignore payload for now but keep signature stable', async () => {
        const gameId = 'game-2';
        const game = { id: gameId } as Game;

        gameRepository.findOne.mockResolvedValueOnce(game);

        const created = {
            id: 'gmt-2',
            game_id: gameId,
            token: 'token-xyz',
            created_at: new Date(),
            revoked_at: null,
            deleted_at: null,
        };

        managementTokenRepository.createForGame
            .mockResolvedValueOnce(created as any);

        const payload = { scope: ['versions:write'], expires_in_days: 7 } as any;

        const result = await useCase.execute(gameId, payload);

        expect(result.id).toBe('gmt-2');
        expect(managementTokenRepository.createForGame)
            .toHaveBeenCalledWith(game, [], undefined, undefined);
    });
});
