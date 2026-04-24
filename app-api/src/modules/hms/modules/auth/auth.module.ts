import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AUTH_CONFIG } from '@src/config/hms/auth.config';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { TwitchStrategy } from './twitch/twitch.strategy';
import { OneTimeTokensModule } from '@hms-module/modules/one-time-tokens/one-time-tokens.module';
import { AuthController } from './controllers/auth.controller';
import { UsersModule } from '../users/users.module';
import { BetterLoggerModule } from '../better-logger/better-logger.module';
import { MailModule } from '../mail/mail.module';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';
import { RedisModule } from '../redis/redis.module';
import { AdminAuthController } from './controllers/admin-auth.controller';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from '../notifications/notifications.module';
import { AuthFacade } from './auth.facade';
import { TokenService } from './services/token.service';
import { TwoFAService } from './services/twofa.service';
import { SessionStorePort } from './services/ports/session-store.port';
import { RedisSessionStoreAdapter } from './services/adapters/redis-session-store.adapter';
import { AuthenticatorRegistryService } from './services/authenticator-registry.service';
import { LoginUseCase } from './services/use-cases/login.usecase';
import { Prepare2FAUseCase } from './services/use-cases/prepare-2fa.usecase';
import { Complete2FALoginUseCase } from './services/use-cases/complete-2fa-login.usecase';
import { RefreshUseCase } from './services/use-cases/refresh.usecase';
import { LogoutUseCase } from './services/use-cases/logout.usecase';
import { CreateAdminInviteUseCase } from './services/use-cases/admin-invite/create-admin-invite.usecase';
import { PrepareAdminAccountCreationUseCase } from './services/use-cases/admin-invite/prepare-admin-account-creation.usecase';
import { CreateAdminFromInviteUseCase } from './services/use-cases/admin-invite/create-admin-from-invite.usecase';
import { ValidateOrCreateUserFromTwitchUseCase } from './services/use-cases/twitch/validate-or-create-user-from-twitch.usecase';
import { GetTwitchAuthDataUseCase } from './services/use-cases/twitch/get-twitch-auth-data.usecase';
import { Generate2FASetupForUserUseCase } from './services/use-cases/twofa/generate-setup-for-user.usecase';
import { Generate2FASetupByEmailUseCase } from './services/use-cases/twofa/generate-setup-by-email.usecase';
import { CompleteAdmin2FASetupUseCase } from './services/use-cases/twofa/complete-admin-setup.usecase';
import { ValidateOneTimeTokenUseCase } from './services/use-cases/twofa/validate-one-time-token.usecase';
import { AuthZService } from './services/authz.service';
import { AuthenticateRequestUseCase } from './services/use-cases/authenticate-request.usecase';
import { ClaimUsernameUseCase } from './services/use-cases/user/claim-username.usecase';
import { RequestAdminLoginEmailUseCase } from './services/use-cases/admin/request-admin-login-email.usecase';
import { RequestEndUserLoginEmailUseCase } from './services/use-cases/end-user/request-end-user-login-email.usecase';
import { AuthSupportPort } from './services/ports/auth-support.port';
import { AuthSupportAdapter } from './services/adapters/auth-support.adapter';
import { TwoFAHandlersBootstrap } from './services/boot/twofa-handlers.bootstrap';
import { AppSetupModule } from '../app-setup/app-setup.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([RefreshToken]),
    PassportModule.register({ session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      /**
       * This factory function is used to configure the JwtModule.
       * It gets the JWT secret from the configuration and sets the
       * expiration time for the access tokens based on the
       * `accessTokenExpirationTime` configuration.
       * @param configService - The ConfigService used to get the JWT secret from the configuration.
       * @returns An object containing the secret and sign options for the JwtModule.
       */
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
    }),
    UsersModule,
    BetterLoggerModule,
    OneTimeTokensModule,
    MailModule,
    RedisModule,
    HttpModule,
    NotificationsModule,
  ],
  controllers: [
    AdminAuthController,
    AuthController,
  ],
  providers: [
    AuthFacade,
    TokenService,
    TwoFAService,
    { provide: SessionStorePort, useClass: RedisSessionStoreAdapter },
    { provide: AuthSupportPort, useClass: AuthSupportAdapter },
    AuthenticatorRegistryService,
    AuthZService,
    TwoFAHandlersBootstrap,
    // Use Cases
    LoginUseCase,
    Prepare2FAUseCase,
    Complete2FALoginUseCase,
    RefreshUseCase,
    LogoutUseCase,
    CreateAdminInviteUseCase,
    PrepareAdminAccountCreationUseCase,
    CreateAdminFromInviteUseCase,
    ValidateOrCreateUserFromTwitchUseCase,
    GetTwitchAuthDataUseCase,
    Generate2FASetupForUserUseCase,
    Generate2FASetupByEmailUseCase,
    CompleteAdmin2FASetupUseCase,
    ValidateOneTimeTokenUseCase,
    AuthenticateRequestUseCase,
    ClaimUsernameUseCase,
    RequestAdminLoginEmailUseCase,
    RequestEndUserLoginEmailUseCase,
    TwitchStrategy,
    RefreshTokenRepository,
  ],
  exports: [
    AuthFacade,
    JwtModule,
  ],
})
export class AuthModule { }
