import { BadRequestException, Body, ConflictException, Controller, Get, HttpCode, HttpException, HttpStatus, Post, Put, Request, Response, UnauthorizedException, UseGuards, UsePipes, ValidationPipe, Version } from "@nestjs/common";
import { BetterLogger } from "@hms-module/modules/better-logger/better-logger.service";
import { responser } from "@hms-module/core/utils/response.util";
import { UserNotFoundException } from "../exceptions/user-not-found.exception";
import { InvalidCredentialsException } from "../exceptions/invalid-credentials.exception";
import { OneTimeTokensService } from "@hms-module/modules/one-time-tokens/one-time-tokens.service";
import { Throttle } from "@nestjs/throttler";
import { UsersService } from "../../users/services/users.service";
import { TwoFactorMethodNotSupportedException } from "../exceptions/two-factor-method-not-supported.exception";
import { AuthenticatedRequest, DeviceRequest } from "../types/request-auth.type";
import { AdminUserBackofficeViewDto } from "@hms/shared-types/hms";
import {
    CreateAdminAccountResponseDto,
    CreateAdminInvitePayload,
    LoginResponseDto,
    Prepare2FAAccountCreationResponseDto,
    RefreshTokenResponseDto,
    Requires2FAResponseDto,
    SingleStepLoginResponseDto
} from "@hms/shared-types/hms";
import { AdminCreationFromInvitePayload, AdminPasswordLoginPayload, StartAdminAccountCreationPayload } from "../payloads/admin-auth.payload";
import { LogoutPayload, OttLoginPayload, RefreshTokenPayload, SecondStepLoginPayload } from "../payloads/auth.payload";
import { AuthFacade } from "../auth.facade";
import { ApiResponse } from "@hms/shared-types/hms";
import { Authenticated } from "@hms-module/core/decorators/authenticated.decorator";
import { AdminUser } from "../../users/entities/admin-user.entity";
import { AccessPolicy, AuthSubject } from "@hms-module/core/decorators/auth-subject.decorator";


@Controller('admin-auth')
export class AdminAuthController {

    constructor(
        private readonly logger: BetterLogger,
        private readonly auth: AuthFacade,
        private readonly usersService: UsersService,
        private readonly oneTimeTokens: OneTimeTokensService,
    ) {
        this.logger.setContext(AdminAuthController.name);
    }

    @Get('me')
    @AuthSubject(AccessPolicy.AdminOnly)
    @HttpCode(HttpStatus.OK)
    async getAdminMe(@Request() req: AuthenticatedRequest): Promise<ApiResponse<AdminUserBackofficeViewDto>> {
        const user = await this.usersService.findAdminById(req.authenticated.id);

        if (!user) {
            throw new UserNotFoundException();
        }

        return responser.data({
            id: user.id,
            email: user.email,
            name: user.name,
            admin_permissions: user.admin_permissions,
            is_owner: user.is_owner,
            became_owner_at: user.became_owner_at
        });
    }

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe())
    @Version(['1'])
    async loginWithPassword(
        @Body() payload: AdminPasswordLoginPayload,
        @Request() req: DeviceRequest,
    ): Promise<ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>> {
        try {
            const loginResponse = await this.auth.login(
                payload,
                'admin',
                req.deviceInfo,
                'password'
            );
            return responser.data(loginResponse);
        } catch (error) {
            this.logger.error(error.message, error.stack);
            if (error instanceof UserNotFoundException || error instanceof InvalidCredentialsException) {
                throw error; // Throw the exception to be handled by the global exception filter
            }
            throw new HttpException('Error logging in', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('login-ott')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe())
    @Version(['1'])
    async loginOtt(
        @Body() payload: OttLoginPayload,
        @Request() req: DeviceRequest,
    ): Promise<ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>> {
        try {
            const loginResponse = await this.auth.login(
                payload,
                'admin',
                req.deviceInfo,
                'ott'
            );
            return responser.data(loginResponse);
        } catch (error) {
            this.logger.error(error.message, error.stack);
            if (error instanceof UserNotFoundException || error instanceof InvalidCredentialsException) {
                throw error; // Throw the exception to be handled by the global exception filter
            }
            throw new HttpException('Error logging in', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Post('complete-2fa-login')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe())
    @Version(['1'])
    async complete2FALogin(
        @Body() payload: SecondStepLoginPayload,
        @Request() req: DeviceRequest
    ): Promise<ApiResponse<LoginResponseDto>> {
        try {
            const loginResponse = await this.auth.completeStep2FALogin(
                payload.second_step_token,
                payload.code,
            );

            return responser.data(loginResponse);
        } catch (error) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException ||
                error instanceof InvalidCredentialsException ||
                error instanceof TwoFactorMethodNotSupportedException) {
                throw error;
            }

            throw new HttpException(
                'Error completing 2FA login',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('create-admin-invite')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AdminOnly)
    @UsePipes(new ValidationPipe({ transform: true }))
    @Version(['1'])
    async createAdminInvite(
        @Body() payload: CreateAdminInvitePayload,
        @Authenticated() authenticated: AdminUser,
    ): Promise<ApiResponse<{ token: string; expires_at: Date }>> {
        try {
            const adminUser = await this.usersService.findAdminById(authenticated.id);

            if (!adminUser) {
                throw new UserNotFoundException();
            }

            const result = await this.auth.createAdminInvite(
                adminUser,
                payload.invitee_email,
            );

            return responser.data(result);
        } catch (error) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                'Error creating admin invite',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('start-admin-account-creation')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    @Version(['1'])
    async startAdminAccountCreation(
        @Body() payload: StartAdminAccountCreationPayload,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponse<Prepare2FAAccountCreationResponseDto>> {
        try {
            const result = await this.auth.prepareAdminAccountCreation(payload.invite_token);
            return responser.data(result);
        } catch (error) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                'Error starting admin account creation',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('create-admin-account-from-invite')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    @Version(['1'])
    async createAdminAccountFromInvite(
        @Body() payload: AdminCreationFromInvitePayload,
        @Request() req: AuthenticatedRequest
    ): Promise<ApiResponse<CreateAdminAccountResponseDto>> {
        try {
            const result = await this.auth.createAdminFromInvite(payload);
            return responser.data(result);
        } catch (error) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException ||
                error instanceof BadRequestException ||
                error instanceof ConflictException) {
                throw error;
            }

            throw new HttpException(
                'Error creating admin account',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @AuthSubject()
    @UsePipes(new ValidationPipe())
    @Version(['1'])
    async logout(
        @Body() payload: LogoutPayload,
        @Authenticated() authenticated: AdminUser,
    ): Promise<ApiResponse<boolean>> {
        const user = await this.usersService.findAdminById(authenticated.id);

        if (!user) {
            throw new UserNotFoundException();
        }

        try {
            await this.auth.logout(user, payload.refresh_token);
            return responser.success();
        } catch (error) {
            this.logger.error(error.message, error.stack);
            throw new HttpException('Error during logout', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @Put('refresh-token')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Body() payload: RefreshTokenPayload,
        @Request() req: DeviceRequest,
    ): Promise<ApiResponse<RefreshTokenResponseDto>> {
        try {

            const refreshResponse = await this.auth.refresh(
                payload.refresh_token,
                req.deviceInfo,
            );
            return responser.data(refreshResponse);
        } catch (error) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new HttpException('Error refreshing token', HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
