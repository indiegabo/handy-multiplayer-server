import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BetterLoggerModule } from '../better-logger/better-logger.module';
import { MediaModule } from '../media/media.module';

import { UsersController } from './controllers/users.controller';
import { UsersBackofficeController } from './controllers/users-backoffice.controller';

import { UsersService } from './services/users.service';

import { User } from './entities/user.entity';
import { UserAuthProvider } from './entities/user-auth-provider.entity';

import { UsersRepository } from './repositories/users.repository';
import { AdminUsersRepository } from './repositories/admin-users.repository';
import { UserAuthProviderRepository } from
    './repositories/user-auth-provider.repository';
import { UserTwoFactorMethodsRepository } from
    './repositories/user-two-factor-methods.repository';
import { AdminUsersBackofficeController } from './controllers/admin-users-backoffice.controller';
import { ListEndUsersUseCase } from './use-cases/end-users/list-end-users.usecase';
import { GetEndUserByIdUseCase } from './use-cases/end-users/get-end-user-by-id.usecase';
import { GetEndUserByUsernameUseCase } from './use-cases/end-users/get-end-user-by-username.usecase';
import { EndUsersFacade } from './facades/end-users.facade';
import { AdminUsersFacade } from './facades/admin-users.facade';
import { ListAdminUsersUseCase } from './use-cases/admin-users/list-admin-users.usecase';

@Module({
    // ---------------------------------------------------------------------------
    // Imports
    // ---------------------------------------------------------------------------
    imports: [
        BetterLoggerModule,
        MediaModule,
        TypeOrmModule.forFeature([
            User,
            UserAuthProvider,
        ]),
    ],

    // ---------------------------------------------------------------------------
    // Controllers
    // ---------------------------------------------------------------------------
    controllers: [
        UsersController,
        UsersBackofficeController,
        AdminUsersBackofficeController,
    ],

    // ---------------------------------------------------------------------------
    // Providers
    // Keep the order: Services -> UseCases -> Facade -> Repositories
    // ---------------------------------------------------------------------------
    providers: [
        // Application services
        UsersService,

        // Use cases (application layer)
        ListEndUsersUseCase,
        GetEndUserByIdUseCase,
        GetEndUserByUsernameUseCase,
        ListAdminUsersUseCase,

        // Facade (orchestrates use cases for controllers)
        EndUsersFacade,
        AdminUsersFacade,

        // Data layer (repositories)
        UsersRepository,
        AdminUsersRepository,
        UserAuthProviderRepository,
        UserTwoFactorMethodsRepository,
    ],

    // ---------------------------------------------------------------------------
    // Exports
    // Export only what other modules may depend on.
    // ---------------------------------------------------------------------------
    exports: [
        // Services and facade for cross-module consumption
        UsersService,
        EndUsersFacade,
        AdminUsersFacade,

        // Repositories used by other modules (if any)
        UsersRepository,
        AdminUsersRepository,
        UserAuthProviderRepository,
        UserTwoFactorMethodsRepository,
    ],
})
export class UsersModule { }
