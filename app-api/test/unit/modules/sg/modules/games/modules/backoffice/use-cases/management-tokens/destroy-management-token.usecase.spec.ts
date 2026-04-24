// sg/modules/games/backoffice/use-cases/destroy-management-token.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { DestroyManagementTokenUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/destroy-management-token.usecase';

import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';

describe('DestroyManagementTokenUseCase', () => {
    let useCase: DestroyManagementTokenUseCase;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        managementTokenRepository = {
            delete: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new DestroyManagementTokenUseCase(
            managementTokenRepository,
        );
    });

    it('throws NotFoundException when no rows are affected', async () => {
        const gameId = 'g-1';
        const tokenId = 't-404';

        managementTokenRepository.delete.mockResolvedValueOnce({
            affected: 0,
            raw: undefined,
        } as any);

        await expect(useCase.execute(gameId, tokenId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(managementTokenRepository.delete).toHaveBeenCalledWith({
            id: tokenId,
            game_id: gameId,
        });
    });

    it('resolves when a row is affected', async () => {
        const gameId = 'g-2';
        const tokenId = 't-1';

        managementTokenRepository.delete.mockResolvedValueOnce({
            affected: 1,
            raw: undefined,
        } as any);

        await expect(useCase.execute(gameId, tokenId))
            .resolves
            .toBeUndefined();

        expect(managementTokenRepository.delete).toHaveBeenCalledTimes(1);
    });
});
