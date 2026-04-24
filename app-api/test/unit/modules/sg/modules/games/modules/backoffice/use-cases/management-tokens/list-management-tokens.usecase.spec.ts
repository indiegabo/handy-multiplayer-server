// sg/modules/games/backoffice/use-cases/list-management-tokens.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { ListManagementTokensUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/list-management-tokens.usecase';

import { GameRepository }
    from '@src/modules/sg/core/repositories/game.repository';
import { Game }
    from '@src/modules/sg/core/entities/game.entity';
import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';
import { GMTListingResponseDTO }
    from '@sg-module/modules/games/dtos/game-management-token.dto';

describe('ListManagementTokensUseCase', () => {
    let useCase: ListManagementTokensUseCase;

    // Mocks for the required repositories.
    let gameRepository: jest.Mocked<GameRepository>;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        gameRepository = {
            findOne: jest.fn(),
            // Unused members can stay undefined to keep the mock minimal.
        } as unknown as jest.Mocked<GameRepository>;

        managementTokenRepository = {
            findAllOfGame: jest.fn(),
            getPartialView: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new ListManagementTokensUseCase(
            gameRepository,
            managementTokenRepository,
        );
    });

    it('should throw NotFoundException when game does not exist', async () => {
        // Arrange
        const gameId = 'non-existing-id';
        gameRepository.findOne.mockResolvedValueOnce(null);

        // Act + Assert
        await expect(useCase.execute(gameId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });
        expect(managementTokenRepository.findAllOfGame)
            .not
            .toHaveBeenCalled();
    });

    it('should return empty list when there are no tokens', async () => {
        // Arrange
        const gameId = 'game-1';
        const game = { id: gameId } as Game;

        gameRepository.findOne.mockResolvedValueOnce(game);
        managementTokenRepository.findAllOfGame
            .mockResolvedValueOnce([]);

        // Act
        const result = await useCase.execute(gameId);

        // Assert
        expect(result).toEqual([]);
        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.findAllOfGame)
            .toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.findAllOfGame)
            .toHaveBeenCalledWith(game);
    });

    it('should map tokens and include partial_view_token', async () => {
        // Arrange
        const gameId = 'game-2';
        const game = { id: gameId, name: 'Test Game' } as Game;

        const rawTokens = [
            {
                id: 't-1',
                game_id: gameId,
                token: 'abcdef123456',
                created_at: new Date('2025-01-01T00:00:00Z'),
                revoked_at: null,
                deleted_at: null,
                // Additional fields are ignored by DTO mapping.
            },
            {
                id: 't-2',
                game_id: gameId,
                token: 'deadbeef999',
                created_at: new Date('2025-01-02T00:00:00Z'),
                revoked_at: new Date('2025-02-01T00:00:00Z'),
                deleted_at: null,
            },
        ];

        gameRepository.findOne.mockResolvedValueOnce(game);
        managementTokenRepository.findAllOfGame
            .mockResolvedValueOnce(rawTokens as any);

        managementTokenRepository.getPartialView
            .mockImplementation((token: string) => {
                // Example implementation consistent with production behavior:
                // Expose first 4 and last 3 chars only.
                if (!token || token.length < 8) return '••••';
                return `${token.slice(0, 4)}••••${token.slice(-3)}`;
            });

        // Act
        const result = await useCase.execute(gameId);

        // Assert
        expect(result).toHaveLength(2);

        // Validate DTO shape and partial token mapping.
        const dto1 = result[0] as GMTListingResponseDTO;
        const dto2 = result[1] as GMTListingResponseDTO;

        expect(dto1.id).toBe('t-1');
        expect(dto1.partial_view_token).toBe('abcd••••456');
        expect(dto1.revoked_at).toBeNull();

        expect(dto2.id).toBe('t-2');
        expect(dto2.partial_view_token).toBe('dead••••999');
        expect(dto2.revoked_at).toBeInstanceOf(Date);

        // Ensure repository interactions.
        expect(gameRepository.findOne).toHaveBeenCalledTimes(1);
        expect(gameRepository.findOne).toHaveBeenCalledWith({
            where: { id: gameId },
        });

        expect(managementTokenRepository.findAllOfGame)
            .toHaveBeenCalledTimes(1);
        expect(managementTokenRepository.findAllOfGame)
            .toHaveBeenCalledWith(game);

        expect(managementTokenRepository.getPartialView)
            .toHaveBeenCalledTimes(2);
        expect(managementTokenRepository.getPartialView)
            .toHaveBeenNthCalledWith(1, 'abcdef123456');
        expect(managementTokenRepository.getPartialView)
            .toHaveBeenNthCalledWith(2, 'deadbeef999');
    });
});
