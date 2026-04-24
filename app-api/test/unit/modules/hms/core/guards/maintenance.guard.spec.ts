import {
    ExecutionContext,
    ServiceUnavailableException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Backoffice } from "@hms-module/core/decorators/backoffice.decorator";
import { MaintenanceGuard } from "@hms-module/core/guards/maintenance.guard";
import { RedisService } from "@hms-module/modules/redis/redis.service";

@Backoffice
class DecoratedBackofficeController { }

class PlainController { }

function createHttpContext(params?: {
    path?: string;
    controllerClass?: Function;
    handler?: Function;
}): ExecutionContext {
    const path = params?.path ?? "/v1/public/games";
    const controllerClass = params?.controllerClass ?? PlainController;
    const handler = params?.handler ?? (() => undefined);

    return {
        getType: () => "http",
        getClass: () => controllerClass,
        getHandler: () => handler,
        switchToHttp: () => ({
            getRequest: () => ({
                originalUrl: path,
                url: path,
            }),
        }),
    } as unknown as ExecutionContext;
}

describe("MaintenanceGuard", () => {
    let guard: MaintenanceGuard;
    let redisService: jest.Mocked<Pick<RedisService, "get">>;

    beforeEach(() => {
        redisService = {
            get: jest.fn(),
        };

        guard = new MaintenanceGuard(
            redisService as unknown as RedisService,
            new Reflector(),
        );
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it("should allow non-http contexts", async () => {
        const context = {
            getType: () => "ws",
        } as unknown as ExecutionContext;

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(redisService.get).not.toHaveBeenCalled();
    });

    it("should allow decorated backoffice controllers", async () => {
        redisService.get.mockResolvedValue("true");

        const context = createHttpContext({
            path: "/v1/admin/games",
            controllerClass: DecoratedBackofficeController,
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(redisService.get).not.toHaveBeenCalled();
    });

    it("should allow backoffice paths as compatibility fallback", async () => {
        redisService.get.mockResolvedValue("true");

        const context = createHttpContext({
            path: "/v1/backoffice/custom",
            controllerClass: PlainController,
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
        expect(redisService.get).not.toHaveBeenCalled();
    });

    it("should block regular paths when maintenance is active", async () => {
        redisService.get.mockResolvedValue("true");

        const context = createHttpContext({
            path: "/v1/launcher/page",
            controllerClass: PlainController,
        });

        await expect(guard.canActivate(context)).rejects.toBeInstanceOf(
            ServiceUnavailableException,
        );
    });

    it("should allow request when redis check fails", async () => {
        redisService.get.mockRejectedValue(new Error("Redis unavailable"));

        const context = createHttpContext({
            path: "/v1/launcher/page",
            controllerClass: PlainController,
        });

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });
});