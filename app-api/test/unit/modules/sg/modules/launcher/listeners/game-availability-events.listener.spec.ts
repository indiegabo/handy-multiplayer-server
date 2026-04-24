import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';
import { RedisService } from '@hms-module/modules/redis/redis.service';
import { GameAvailability } from '@hms/shared-types';
import {
    SG_GAME_AVAILABILITY_CHANGED_EVENT,
    SG_GAME_AVAILABILITY_CHANGED_REDIS_CHANNEL,
    SgGameAvailabilityChangedEventPayload,
} from '@src/modules/sg/core/events/game-availability-changed.event';
import { GameEventsGateway } from '@src/modules/sg/modules/launcher/gateways/game-events.gateway';
import { GameAvailabilityEventsListener } from '@src/modules/sg/modules/launcher/listeners/game-availability-events.listener';

describe('GameAvailabilityEventsListener', () => {
    let listener: GameAvailabilityEventsListener;
    let logger: jest.Mocked<BetterLogger>;
    let redisService: jest.Mocked<RedisService>;
    let gateway: jest.Mocked<GameEventsGateway>;

    beforeEach(() => {
        logger = {
            setContext: jest.fn(),
            warn: jest.fn(),
        } as any;

        redisService = {
            publish: jest.fn(),
        } as any;

        gateway = {
            emitAvailabilityChanged: jest.fn(),
            emitAvailable: jest.fn(),
            emitUnavailable: jest.fn(),
        } as any;

        listener = new GameAvailabilityEventsListener(
            logger,
            redisService,
            gateway,
        );
    });

    const basePayload: SgGameAvailabilityChangedEventPayload = {
        gameId: 'g1',
        previousAvailability: GameAvailability.ComingSoon,
        nextAvailability: GameAvailability.Available,
        changed: true,
        changedAt: new Date().toISOString(),
        source: 'test',
    };

    it('publishes to redis and emits socket available event', async () => {
        await listener.handle(basePayload);

        expect(redisService.publish).toHaveBeenCalledWith(
            SG_GAME_AVAILABILITY_CHANGED_REDIS_CHANNEL,
            JSON.stringify({
                event: SG_GAME_AVAILABILITY_CHANGED_EVENT,
                payload: basePayload,
            }),
        );

        expect(gateway.emitAvailabilityChanged).toHaveBeenCalledWith(
            'g1',
            basePayload,
        );
        expect(gateway.emitAvailable).toHaveBeenCalledWith('g1', basePayload);
        expect(gateway.emitUnavailable).not.toHaveBeenCalled();
    });

    it('emits unavailable socket event when next status is unavailable', async () => {
        const payload = {
            ...basePayload,
            nextAvailability: GameAvailability.Unavailable,
        };

        await listener.handle(payload);

        expect(gateway.emitUnavailable).toHaveBeenCalledWith('g1', payload);
        expect(gateway.emitAvailable).not.toHaveBeenCalled();
    });

    it('continues socket emission when redis publish fails', async () => {
        redisService.publish.mockRejectedValue(new Error('redis down'));

        await listener.handle(basePayload);

        expect(gateway.emitAvailabilityChanged).toHaveBeenCalledWith(
            'g1',
            basePayload,
        );
        expect(logger.warn).toHaveBeenCalled();
    });
});
