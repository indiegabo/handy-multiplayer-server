import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * Test-only guard that allows every request to pass.
 */
@Injectable()
export class AllowAllGuard implements CanActivate {
    canActivate(_context: ExecutionContext): boolean {
        return true;
    }
}
