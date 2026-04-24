import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Injects a fake Game entity into the request so that `@GameFromToken()`
 * parameter decorator can resolve it from common locations.
 *
 * Used in development controller E2E tests to simulate game management token authentication.
 */
@Injectable()
export class MockGameAuthMiddleware implements NestMiddleware {
    constructor(private readonly gameId: string) { }

    use = (req: Request, _res: Response, next: NextFunction): void => {
        const game = {
            id: this.gameId,
            name: 'Test Game',
            description: 'A test game for E2E testing',
            cover_url: 'https://example.com/cover.png',
            type: 1,
            availability: 1,
            meta: {},
            created_at: new Date('2026-01-01T00:00:00Z'),
            updated_at: new Date('2026-01-01T00:00:00Z'),
        };

        // Common places used by custom decorators.
        (req as any).game = game;
        (req as any).gameFromToken = game;

        next();
    }
}
