import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameAvailability } from '@hms/shared-types';
import { RequestGamePurgeUseCase } from '@src/modules/sg/modules/games/modules/backoffice/use-cases/games/request-game-purge.usecase';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameAvailabilityService } from '@src/modules/sg/core/services/game-availability.service';
import { SG_GAME_PURGE_REQUESTED_EVENT } from '@src/modules/sg/core/events/game-purge.events';

describe('RequestGamePurgeUseCase', () => {
    let useCase: RequestGamePurgeUseCase;
    let emitter: jest.Mocked<EventEmitter2>;
    let gameRepository: jest.Mocked<GameRepository>;
    let gameAvailabilityService: jest.Mocked<GameAvailabilityService>;

    beforeEach(() => {
        emitter = {
            emit: jest.fn(),
        } as any;

        gameRepository = {
            findById: jest.fn(),
        } as any;

        gameAvailabilityService = {
            setAvailability: jest.fn(),
        } as any;

        useCase = new RequestGamePurgeUseCase(
            emitter,
            gameRepository,
            gameAvailabilityService,
        );
    });

    it('throws NotFoundException when game does not exist', async () => {
        gameRepository.findById.mockResolvedValue(null);

        await expect(
            useCase.execute({ gameId: 'missing' }),
        ).rejects.toBeInstanceOf(NotFoundException);

        expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('sets game as Unlisted and emits purge request event', async () => {
        gameRepository.findById.mockResolvedValue({
            id: 'g1',
            availability: GameAvailability.Available,
        } as any);

        gameAvailabilityService.setAvailability.mockResolvedValue({
            gameId: 'g1',
            previousAvailability: GameAvailability.Available,
            nextAvailability: GameAvailability.Unlisted,
            changed: true,
            changedAt: new Date().toISOString(),
            source: 'sg.backoffice.purge.request',
        } as any);

        const result = await useCase.execute({
            gameId: 'g1',
            requestedByAdminId: 'admin-1',
            reason: 'security incident',
        });

        expect(gameAvailabilityService.setAvailability).toHaveBeenCalledWith(
            'g1',
            GameAvailability.Unlisted,
            expect.objectContaining({
                source: 'sg.backoffice.purge.request',
                reason: 'security incident',
                requestedByAdminId: 'admin-1',
                forceEmit: true,
            }),
        );

        expect(emitter.emit).toHaveBeenCalledWith(
            SG_GAME_PURGE_REQUESTED_EVENT,
            expect.objectContaining({
                operationId: result.operation_id,
                gameId: 'g1',
                requestedByAdminId: 'admin-1',
                reason: 'security incident',
            }),
        );

        expect(result).toEqual(
            expect.objectContaining({
                game_id: 'g1',
                status: 'accepted',
            }),
        );
    });
});
