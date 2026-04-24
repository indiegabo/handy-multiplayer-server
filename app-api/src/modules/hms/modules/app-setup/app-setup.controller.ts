import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    ForbiddenException,
    Get,
    HttpCode,
    NotFoundException,
    Post,
    Request,
    UsePipes,
    ValidationPipe,
    Version,
} from "@nestjs/common";
import { AppSetupService } from "./app-setup.service";
import { StartOwnerCreationDto } from "./dto/create-owner-setup.dto";
import { SetupStatusDto } from "./dto/setup-status.dto";
import { responser } from "@hms-module/core/utils/response.util";
import { ConnectionStatusDto } from "./dto/connection-status.dto";
import { CreateOwnerResponseDto, OwnerCheckUpDto, OwnerCreationStartResponseDto, OwnerResponseDto } from "./dto/create-owner-response.dto";
import { Request as InterceptedRequest } from 'express';
import { BetterLogger } from "../better-logger/better-logger.service";
import { UsersService } from "../users/services/users.service";
import { AdminCreationBasePayload } from "../auth/payloads/admin-auth.payload";
import { AuthFacade } from "../auth/auth.facade";
import { ApiResponse } from "@hms/shared-types/hms";
import { AccessPolicy, AuthSubject } from "@hms-module/core/decorators/auth-subject.decorator";
import { Authenticated } from "@hms-module/core/decorators/authenticated.decorator";
import { AdminUser } from "../users/entities/admin-user.entity";

@Controller('app-setup')
/**
 * Controller responsible for application initial setup flows.
 *
 * Public endpoints are used by the setup UI to verify external
 * dependencies and to perform the initial owner creation flow.
 */
export class AppSetupController {
    constructor(
        private readonly service: AppSetupService,
        private readonly auth: AuthFacade,
        private readonly logger: BetterLogger,
        private readonly usersService: UsersService,
    ) {
        this.logger.setContext(AppSetupController.name);
    }

    /**
     * Returns current setup status.
     * @returns ApiResponse with setup status
     */
    @Get('status')
    @Version('1')
    @HttpCode(200)
    async getStatus(): Promise<ApiResponse<SetupStatusDto>> {
        const status = await this.service.checkSetupStatus();

        return responser.data(status);
    }

    /**
     * Check connectivity to the main database.
     */
    @Get('connection-status/main-db')
    @HttpCode(200)
    @Version('1')
    async checkMainDb(): Promise<ApiResponse<ConnectionStatusDto>> {
        try {
            const isConnected = await this.service.checkMainDb();

            return responser.data({
                service: 'main-db',
                status: isConnected,
            });
        } catch (error) {
            return responser.data({
                service: 'main-db',
                status: false,
                error: error.message,
                details: this.extractErrorDetails(error),
            });
        }
    }

    /**
     * Check connectivity to the game database.
     */
    @Get('connection-status/game-db')
    @HttpCode(200)
    @Version('1')
    async checkGameDb(): Promise<ApiResponse<ConnectionStatusDto>> {
        try {
            const isConnected = await this.service.checkGameDb();

            return responser.data({
                service: 'game-db',
                status: isConnected,
            });
        } catch (error) {
            return responser.data({
                service: 'game-db',
                status: false,
                error: error.message,
                details: this.extractErrorDetails(error),
            });
        }
    }

    /**
     * Check connectivity to Redis.
     */
    @Get('connection-status/redis')
    @HttpCode(200)
    @Version('1')
    async checkRedis(): Promise<ApiResponse<ConnectionStatusDto>> {
        try {
            const isConnected = await this.service.checkRedis();

            return responser.data({
                service: 'redis',
                status: isConnected,
            });
        } catch (error) {
            return responser.data({
                service: 'redis',
                status: false,
                error: error.message,
                details: this.extractErrorDetails(error),
            });
        }
    }

    /**
     * Check connectivity to SMTP service.
     */
    @Get('connection-status/smtp')
    @HttpCode(200)
    @Version('1')
    async checkSmtp(): Promise<ApiResponse<ConnectionStatusDto>> {
        try {
            const isConnected = await this.service.checkSmtp();

            return responser.data({
                service: 'smtp',
                status: isConnected,
            });
        } catch (error) {
            return responser.data({
                service: 'smtp',
                status: false,
                error: error.message,
                details: this.extractErrorDetails(error),
            });
        }
    }

    /**
     * Returns whether an owner account already exists. This endpoint
     * is gated when setup is already completed.
     */
    @Get('owner-exists')
    @HttpCode(200)
    @Version('1')
    async checkOwnerExists(): Promise<ApiResponse<OwnerCheckUpDto>> {
        const setupStatus = await this.service.checkSetupStatus();

        if (setupStatus.is_complete) {
            throw new ForbiddenException(
                'Cannot verify Owner if app is already setup',
            );
        }

        const checkUp = await this.service.checkOwnerExists();

        return responser.data(checkUp);
    }

    /**
     * Starts the owner creation process (sends verification or setup
     * instructions to the provided contact).
     */
    @Post('start-owner-creation')
    @HttpCode(200)
    @Version('1')
    @UsePipes(new ValidationPipe({ transform: true, }))
    async startOwnerCreation(
        @Body()
        payload: StartOwnerCreationDto,
    ): Promise<ApiResponse<OwnerCreationStartResponseDto>> {
        const data = await this.service.startOwnerCreationProcess(payload);

        return responser.data(data);
    }

    /**
     * Create the initial owner account. Validates the minimum set of
     * external services required for this flow (main-db, redis, smtp).
     */
    @Post('create-owner')
    @HttpCode(200)
    @Version('1')
    @UsePipes(new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
    }))
    async createOwner(
        @Body()
        payload: AdminCreationBasePayload,
        @Request()
        req: InterceptedRequest,
    ): Promise<
        ApiResponse<{
            backup_codes: string[];
            owner: OwnerResponseDto;
        }>
    > {
        try {
            // 1. Validate only the connections required for creating the owner
            const connectionResults = await this.validateCreateOwnerConnections();
            const failedConnections = connectionResults.filter(result => !result.data.status);

            if (failedConnections.length > 0) {
                throw new BadRequestException({
                    message: 'Some services are not available',
                    failedServices: failedConnections.map(c => ({
                        service: c.data.service,
                        error: c.data.error,
                        details: c.data.details,
                    })),
                });
            }

            // 2. Create owner
            const { owner, backup_codes } = await this.service.createOwner(
                payload,
                req.deviceInfo,
            );

            await this.service.markSetupAsComplete({
                ownerEmail: owner.email,
                completedBy: owner.id,
                connections: connectionResults.reduce(
                    (acc, curr) => {
                        acc[curr.data.service] = curr.data.status;

                        return acc;
                    },
                    {} as Record<string, boolean>,
                ),
            });

            return responser.data({
                backup_codes,
                owner: {
                    id: owner.id,
                    email: owner.email,
                    name: owner.name,
                    created_at: owner.created_at
                }
            });
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException({
                message: 'Failed to complete setup',
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && {
                    stack: error.stack,
                }),
            });
        }
    }

    /**
     * Validate connections required specifically for the `createOwner` flow.
     * Only checks: main-db, redis and smtp.
     */
    private async validateCreateOwnerConnections(): Promise<ApiResponse<ConnectionStatusDto>[]> {
        return Promise.all([
            this.checkMainDb(),
            this.checkRedis(),
            this.checkSmtp(),
        ]);
    }

    /**
     * Marks the application setup as finished by the authenticated
     * admin user. Validates admin existence and owner privileges,
     * verifies required connections and then marks setup as complete.
     *
     * @param authenticated - Authenticated admin user performing action
     */
    @Post('finish')
    @HttpCode(200)
    @Version('1')
    @AuthSubject(AccessPolicy.AdminOnly)
    @UsePipes(
        new ValidationPipe({
            transform: true,
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    )
    async finishSetup(
        @Authenticated()
        authenticated: AdminUser,
    ): Promise<void> {
        try {
            const adminUser = await this.usersService.findAdminByEmail(authenticated.email);
            if (!adminUser) {
                throw new NotFoundException();
            }

            if (!adminUser.is_owner) {
                throw new ForbiddenException();
            }

            const connectionResults = await this.validateAllConnectionsIndividually();
            const failedConnections = connectionResults.filter(result => !result.data.status);

            if (failedConnections.length > 0) {
                throw new BadRequestException({
                    message: 'Some services are not available',
                    failedServices: failedConnections.map(c => ({
                        service: c.data.service,
                        error: c.data.error,
                        details: c.data.details,
                    })),
                });
            }

            await this.service.markSetupAsComplete({
                ownerEmail: adminUser.email,
                completedBy: adminUser.id,
                connections: connectionResults.reduce((acc, curr) => {
                    acc[curr.data.service] = curr.data.status;
                    return acc;
                }, {}),
            });
        } catch (error) {
            if (error instanceof BadRequestException) {
                throw error;
            }
            throw new BadRequestException({
                message: 'Failed to complete setup',
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && {
                    stack: error.stack,
                }),
            });
        }
    }

    /**
     * Resets the application setup state and related resources to an
     * initial state. Use with caution — this is primarily intended for
     * tests and controlled environments.
     *
     * @returns ApiResponse<boolean> - true when reset completes
     */
    @Delete('reset-app')
    @HttpCode(200)
    @Version('1')
    async resetApp(): Promise<ApiResponse<boolean>> {
        await this.service.resetApp();

        return responser.data(true);
    }

    private async validateAllConnectionsIndividually(): Promise<ApiResponse<ConnectionStatusDto>[]> {
        return Promise.all([
            this.checkMainDb(),
            // this.checkGameDb(),
            this.checkRedis(),
            this.checkSmtp()
        ]);
    }

    private extractErrorDetails(error: any) {
        return {
            code: error.code,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
            additionalInfo: error.response?.data || error.config
        };
    }
}