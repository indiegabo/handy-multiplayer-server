import { Module } from "@nestjs/common";
import { APP_GUARD, Reflector } from "@nestjs/core";
import { AuthModule } from "@hms-module/modules/auth/auth.module";
import { RedisModule } from "@hms-module/modules/redis/redis.module";
import { AuthGuard } from "@hms-module/core/guards/auth.guard";
import { MaintenanceGuard } from "@hms-module/core/guards/maintenance.guard";

/**
 * SecurityModule wires global guards. It imports AuthModule so AuthFacade
 * can be injected into guards via DI.
 */
@Module({
    imports: [AuthModule, RedisModule],
    providers: [
        Reflector,
        {
            provide: APP_GUARD,
            useClass: MaintenanceGuard,
        },
        {
            provide: APP_GUARD,
            useClass: AuthGuard,
        },
    ],
})
export class SecurityModule { }
