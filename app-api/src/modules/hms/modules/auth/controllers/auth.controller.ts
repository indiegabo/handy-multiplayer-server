import {
    Body,
    Controller,
    Get,
    HttpCode,
    HttpException,
    HttpStatus,
    Post,
    Put,
    Query,
    Request,
    Response,
    UnauthorizedException,
    UseGuards,
    UsePipes,
    ValidationPipe,
    Version,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import { BetterLogger } from
    '@hms-module/modules/better-logger/better-logger.service';
import { AuthGuard } from '@hms-module/core/guards/auth.guard';
import { AUTH_CONFIG } from '@src/config/hms/auth.config';

import { UsersService } from
    '@hms-module/modules/users/services/users.service';
import { OneTimeTokensService } from
    '@hms-module/modules/one-time-tokens/one-time-tokens.service';
import { AuthFacade } from '../auth.facade';

import { responser } from
    '@hms-module/core/utils/response.util';

import { UserNotFoundException } from
    '../exceptions/user-not-found.exception';
import { InvalidCredentialsException } from
    '../exceptions/invalid-credentials.exception';
import { UsernameAlreadyExistsException } from
    '../exceptions/username-already-exists.exception';

import { Authenticated } from
    '@hms-module/core/decorators/authenticated.decorator';

import { User } from
    '@hms-module/modules/users/entities/user.entity';
import { AdminUser } from
    '@hms-module/modules/users/entities/admin-user.entity';

import {
    RefreshTokenResponseDto,
    Requires2FAResponseDto,
    SendLoginCodeResponseDto,
    SingleStepLoginResponseDto,
    ApiResponse,
    UserBackofficeViewDto,
} from "@hms/shared-types/hms";

import {
    AuthenticatedRequest,
    DeviceRequest,
} from '../types/request-auth.type';

import {
    ClaimUsernamePayload,
    EndUserPasswordLoginPayload,
    LogoutPayload,
    OttLoginPayload,
    RefreshTokenPayload,
} from '../payloads/auth.payload';

import { TwitchAuthProviderData } from '../twitch/twitch-auth-provider-data';
import { AccessPolicy, AuthSubject } from '@hms-module/core/decorators/auth-subject.decorator';
import { registerGlobalBetterLogger } from '../../better-logger/global-better-logger';
import { IsUsernameAvailableQuery } from '../payloads/is-username-avalilable.query';
import { RequestLoginCodePayload } from '../payloads/request-login-code.payload';

@Controller('auth')
export class AuthController {
    constructor(
        private readonly logger: BetterLogger,
        private readonly auth: AuthFacade,
        private readonly usersService: UsersService,
        private readonly oneTimeTokens: OneTimeTokensService,
    ) {
        this.logger.setContext(AuthController.name);
        registerGlobalBetterLogger(this.logger);
    }

    /* ======================================================================
     *                          SESSION / IDENTITY
     *  - /auth/me
     *  - /auth/logout
     *  - /auth/refresh-token
     * ====================================================================== */

    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
    @Get('me')
    async getMe(
        @Request() req: AuthenticatedRequest,
    ): Promise<ApiResponse<UserBackofficeViewDto>> {
        const user = await this.usersService.findUserById(
            req.authenticated.id,
        );

        if (!user) {
            throw new UserNotFoundException();
        }

        return responser.data({
            id: user.id,
            email: user.email,
            username: user.username,
            display_name: user.display_name,
            two_factor_enabled: user.two_factor_enabled,
        });
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @Version(['1'])
    async logout(
        @Authenticated() authenticated: User,
        @Body() payload: LogoutPayload,
        @Request() request: AuthenticatedRequest,
    ): Promise<ApiResponse<boolean>> {
        const user = await this.usersService.findUserById(authenticated.id);

        if (!user) {
            throw new UserNotFoundException();
        }

        try {
            await this.auth.logout(user, payload.refresh_token);
            return responser.success();
        } catch (error: any) {
            this.logger.error(
                error?.message ?? 'Logout failed',
                error?.stack,
            );
            throw new HttpException(
                'Error during logout',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Put('refresh-token')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
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
        } catch (error: any) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UnauthorizedException) {
                throw error;
            }

            throw new HttpException(
                'Error refreshing token',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /* ======================================================================
     *                               AUTH (END USER)
     *  - /auth/login (password)
     *  - /auth/login-ott (one-time token)
     * ====================================================================== */

    @Post('login')
    @Throttle({ default: { limit: 5, ttl: 60 } })
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe())
    @Version(['1'])
    async loginWithPassword(
        @Body() payload: EndUserPasswordLoginPayload,
        @Request() req: DeviceRequest,
    ): Promise<
        ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>
    > {
        try {
            const loginResponse = await this.auth.login(
                payload,
                'end_user',
                req.deviceInfo,
                'password',
            );
            return responser.data(loginResponse);
        } catch (error: any) {
            this.logger.error(error.message, error.stack);

            if (
                error instanceof UserNotFoundException ||
                error instanceof InvalidCredentialsException
            ) {
                throw error;
            }

            throw new HttpException(
                'Error logging in',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
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
    ): Promise<
        ApiResponse<SingleStepLoginResponseDto | Requires2FAResponseDto>
    > {
        try {
            const loginResponse = await this.auth.login(
                payload,
                'end_user',
                req.deviceInfo,
                'ott',
            );
            return responser.data(loginResponse);
        } catch (error: any) {
            this.logger.error(error.message, error.stack);

            if (
                error instanceof UserNotFoundException ||
                error instanceof InvalidCredentialsException
            ) {
                throw error;
            }

            throw new HttpException(
                'Error logging in',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Post('send-login-code')
    @Throttle({ default: { limit: 6, ttl: 60 } })
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @Version(['1'])
    async sendLoginCode(
        @Body() payload: RequestLoginCodePayload,
    ): Promise<ApiResponse<SendLoginCodeResponseDto>> {
        try {
            const sendCodeResult =
                await this.auth.requestEndUserLoginEmail(payload.term);

            return responser.data(sendCodeResult);
        } catch (error: any) {
            this.logger.error(
                error?.message ?? 'Error sending login code',
                error?.stack,
            );
            throw new HttpException(
                'Error sending login code',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /* ======================================================================
     *                             USERNAME MANAGEMENT
     *  - /auth/is-username-available
     *  - /auth/claim-username
     * ====================================================================== */

    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
    @Get('is-username-available')
    async isUsernameAvailable(
        @Query() q: IsUsernameAvailableQuery,
        @Request() req: AuthenticatedRequest,
    ): Promise<ApiResponse<boolean>> {
        const exists = await this.usersService.findByUsername(q.username);
        return responser.data(!exists);
    }

    @Post('claim-username')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
    @UsePipes(new ValidationPipe())
    async claimUsername(
        @Body() payload: ClaimUsernamePayload,
        @Request() request: AuthenticatedRequest,
    ): Promise<ApiResponse<boolean>> {
        const user = await this.usersService.findUserById(
            request.authenticated.id,
        );

        if (!user) {
            throw new UserNotFoundException();
        }

        try {
            await this.auth.claimUsername(user, payload.username);
            return responser.success();
        } catch (error: any) {
            this.logger.error(error.message, error.stack);

            if (error instanceof UsernameAlreadyExistsException) {
                throw error;
            }

            throw new HttpException(
                'Error creating username',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    /* ======================================================================
     *                              TWITCH OAUTH
     *  - /auth/twitch
     *  - /auth/twitch/callback
     *  - /auth/twitch/auth-data
     * ====================================================================== */

    @Get('twitch')
    @HttpCode(HttpStatus.OK)
    @UseGuards(PassportAuthGuard('twitch'))
    async twitchAuth() {
        // Passport handles the OAuth redirect.
    }

    @Get('twitch/callback')
    @HttpCode(HttpStatus.OK)
    @UseGuards(PassportAuthGuard('twitch'))
    async twitchAuthRedirect(@Request() req, @Response() res) {
        const user = req.user as User;

        const base = AUTH_CONFIG.oauth?.twitch?.ottRedirectBaseUrl;

        if (!base || !base.trim()) {
            throw new HttpException(
                'Twitch OTT redirect URL is not configured.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        try {
            // Basic format validation through a synthetic URL.
            // Final redirect concatenates the real token below.
            // eslint-disable-next-line no-new
            new URL(`${base}?token=probe`);
        } catch {
            throw new HttpException(
                'Twitch authentication not configured correctly.',
                HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }

        const ott = await this.oneTimeTokens.create(
            {
                userId: user.id,
                userType: 'end_user',
            },
            1000 * 60 * 2,
        );

        const redirectUrl =
            `${base}?token=${encodeURIComponent(ott.token)}`;

        res.redirect(redirectUrl);
    }

    @Get('twitch/auth-data')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AnyUser)
    async getTwitchCredentials(
        @Request() req: AuthenticatedRequest,
    ): Promise<ApiResponse<TwitchAuthProviderData>> {
        const user = await this.usersService.findUserById(
            req.authenticated.id,
        );

        if (!user) {
            throw new UserNotFoundException();
        }

        const twitchAuthData = await this.auth.getTwitchAuthData(user);
        return responser.data(twitchAuthData);
    }
}
