import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Injects a fake AdminUser into the request so that `@Authenticated()`
 * parameter decorator can resolve it from common locations.
 */
@Injectable()
export class MockAdminAuthMiddleware implements NestMiddleware {
    use(req: Request, _res: Response, next: NextFunction): void {
        const admin = {
            id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
            email: 'owner@example.com',
            name: 'Owner Admin',
            password: null,
            two_factor_enabled: true,
            admin_permissions: {
                all: true,
                granted_at: new Date('2025-01-01T00:00:00.000Z').toISOString(),
                granted_by: 1,
            },
            is_owner: true,
            became_owner_at: new Date('2025-01-02T00:00:00.000Z'),
            created_at: new Date('2025-01-01T00:00:00.000Z'),
            updated_at: new Date('2025-01-02T00:00:00.000Z'),
        };

        // Common places used by custom decorators.
        (req as any).user = admin;
        (req as any).authenticated = admin;

        next();
    }
}
