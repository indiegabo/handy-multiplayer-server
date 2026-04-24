import { NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GameAvailability } from '@hms/shared-types';
import {
    SG_GAME_AVAILABILITY_CHANGED_EVENT,
} from '@src/modules/sg/core/events/game-availability-changed.event';
import { GameRepository } from '@src/modules/sg/core/repositories/game.repository';
import { GameAvailabilityService } from '@src/modules/sg/core/services/game-availability.service';

describe('GameAvailabilityService', () => {
    let service: GameAvailabilityService;
    let gameRepository: jest.Mocked<GameRepository>;
    let emitter: jest.Mocked<EventEmitter2>;

    beforeEach(() => {
        gameRepository = {
            findById: jest.fn(),
            save: jest.fn(),
        } as any;

        emitter = {
            emit: jest.fn(),
        } as any;

        service = new GameAvailabilityService(
            gameRepository,
            emitter,
        );
    });

    it('throws NotFoundException when game does not exist', async () => {
        gameRepository.findById.mockResolvedValue(null);

        await expect(
            service.setAvailability('missing', GameAvailability.Unlisted),
        ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('updates availability and emits internal event when changed', async () => {
        const game = {
            id: 'g1',
            availability: GameAvailability.Available,
        } as any;

        gameRepository.findById.mockResolvedValue(game);
        gameRepository.save.mockResolvedValue({
            ...game,
            availability: GameAvailability.Unlisted,
        } as any);

        const result = await service.setAvailability(
            'g1',
            GameAvailability.Unlisted,
            {
                source: 'test.source',
                reason: 'test reason',
            },
        );

        expect(gameRepository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                id: 'g1',
                availability: GameAvailability.Unlisted,
            }),
        );

        expect(emitter.emit).toHaveBeenCalledWith(
            SG_GAME_AVAILABILITY_CHANGED_EVENT,
            expect.objectContaining({
                gameId: 'g1',
                previousAvailability: GameAvailability.Available,
                nextAvailability: GameAvailability.Unlisted,
                changed: true,
                source: 'test.source',
            }),
        );

        expect(result.changed).toBe(true);
    });

    it('does not emit when availability is unchanged', async () => {
        const game = {
            id: 'g2',
            availability: GameAvailability.Unlisted,
        } as any;

        gameRepository.findById.mockResolvedValue(game);

        const result = await service.setAvailability(
            'g2',
            GameAvailability.Unlisted,
            {
                source: 'test.source',
            },
        );

        expect(gameRepository.save).not.toHaveBeenCalled();
        expect(emitter.emit).not.toHaveBeenCalled();
        expect(result.changed).toBe(false);
    });

    it('emits unchanged event when forceEmit is true', async () => {
        const game = {
            id: 'g3',
            availability: GameAvailability.Unlisted,
        } as any;

        gameRepository.findById.mockResolvedValue(game);

        await service.setAvailability(
            'g3',
            GameAvailability.Unlisted,
            {
                source: 'test.source',
                forceEmit: true,
            },
        );

        expect(emitter.emit).toHaveBeenCalledWith(
            SG_GAME_AVAILABILITY_CHANGED_EVENT,
            expect.objectContaining({
                gameId: 'g3',
                changed: false,
            }),
        );
    });
});
