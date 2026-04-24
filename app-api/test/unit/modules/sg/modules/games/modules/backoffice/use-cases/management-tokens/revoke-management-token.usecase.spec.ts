// sg/modules/games/backoffice/use-cases/revoke-management-token.usecase.spec.ts
import { NotFoundException } from '@nestjs/common';
import { RevokeManagementTokenUseCase }
    from '../../../../../../../../../../src/modules/sg/modules/games/modules/backoffice/use-cases/management-tokens/revoke-management-token.usecase';

import { GameManagementTokenRepository }
    from '@src/modules/sg/core/repositories/game-management-token.repository';

describe('RevokeManagementTokenUseCase', () => {
    let useCase: RevokeManagementTokenUseCase;
    let managementTokenRepository:
        jest.Mocked<GameManagementTokenRepository>;

    beforeEach(() => {
        managementTokenRepository = {
            update: jest.fn(),
        } as unknown as jest.Mocked<GameManagementTokenRepository>;

        useCase = new RevokeManagementTokenUseCase(
            managementTokenRepository,
        );
    });

    it('throws NotFoundException when no rows are affected', async () => {
        const gameId = 'g-1';
        const tokenId = 't-404';

        managementTokenRepository.update.mockResolvedValueOnce({
            affected: 0,
            raw: undefined,
            generatedMaps: [],
        } as any);

        await expect(useCase.execute(gameId, tokenId))
            .rejects
            .toBeInstanceOf(NotFoundException);

        expect(managementTokenRepository.update).toHaveBeenCalledWith(
            { id: tokenId, game_id: gameId },
            { revoked_at: expect.any(Date) },
        );
    });

    it('resolves when a row is affected', async () => {
        const gameId = 'g-2';
        const tokenId = 't-1';

        managementTokenRepository.update.mockResolvedValueOnce({
            affected: 1,
            raw: undefined,
            generatedMaps: [],
        } as any);

        await expect(useCase.execute(gameId, tokenId))
            .resolves
            .toBeUndefined();

        expect(managementTokenRepository.update).toHaveBeenCalledTimes(1);
    });
});
