import { Test, TestingModule } from '@nestjs/testing';
import { CreateAdminInviteUseCase } from '../../../../../../../../../src/modules/hms/modules/auth/services/use-cases/admin-invite/create-admin-invite.usecase';
import { ConfigService } from '@nestjs/config';
import { BetterLogger } from '../../../../../../../../../src/modules/hms/modules/better-logger/better-logger.service';
import { UsersService } from '../../../../../../../../../src/modules/hms/modules/users/services/users.service';
import { OneTimeTokensService } from '../../../../../../../../../src/modules/hms/modules/one-time-tokens/one-time-tokens.service';
import { MailService } from '../../../../../../../../../src/modules/hms/modules/mail/mail.service';
describe('CreateAdminInviteUseCase (buildAdminInviteUrl)', () => {
    const makeModule = async (config: Record<string, any>) => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                CreateAdminInviteUseCase,
                {
                    provide: ConfigService,
                    useValue: {
                        get: (key: string) => config[key],
                    },
                },
                {
                    provide: BetterLogger,
                    useValue: {
                        warn: jest.fn(),
                        info: jest.fn(),
                        error: jest.fn(),
                    },
                },
                // other dependencies not required for this test (provide by token)
                { provide: UsersService, useValue: {} },
                { provide: OneTimeTokensService, useValue: {} },
                { provide: MailService, useValue: {} },
            ],
        }).compile();

        return module.get<CreateAdminInviteUseCase>(CreateAdminInviteUseCase);
    };

    // Note: base URL support is not present in this codepath; tests cover
    // host/port handling for production and development environments.

    it('omits port when HMS_ADMIN_PANEL_PORT is undefined (production)', async () => {
        const cfg = {
            HMS_ADMIN_PANEL_HOST: 'admin.lung-sg.com',
            APP_ENVIRONMENT: 'production',
        };

        const useCase = await makeModule(cfg);
        const url = (useCase as any).buildAdminInviteUrl('tok');

        expect(url).toBe(
            'https://admin.lung-sg.com/auth/create-admin-account?token=tok',
        );
    });

    it('omits :port when port is 80', async () => {
        const cfg = {
            HMS_ADMIN_PANEL_HOST: 'admin.lung-sg.com',
            HMS_ADMIN_PANEL_PORT: '80',
            APP_ENVIRONMENT: 'production',
        };

        const useCase = await makeModule(cfg);
        const url = (useCase as any).buildAdminInviteUrl('p80');

        expect(url).toBe(
            'https://admin.lung-sg.com/auth/create-admin-account?token=p80',
        );
    });

    it('in production, ignores provided non-80 port and omits it', async () => {
        const cfg = {
            HMS_ADMIN_PANEL_HOST: 'admin.lung-sg.com',
            HMS_ADMIN_PANEL_PORT: '3000',
            APP_ENVIRONMENT: 'production',
        };

        const useCase = await makeModule(cfg);
        const url = (useCase as any).buildAdminInviteUrl('prod3000');

        expect(url).toBe(
            'https://admin.lung-sg.com/auth/create-admin-account?token=prod3000',
        );
    });

    it('includes port in development when provided (non-80)', async () => {
        const cfg = {
            HMS_ADMIN_PANEL_HOST: 'localhost',
            HMS_ADMIN_PANEL_PORT: '3000',
            APP_ENVIRONMENT: 'development',
        };

        const useCase = await makeModule(cfg);
        const url = (useCase as any).buildAdminInviteUrl('dev');

        expect(url).toBe('http://localhost:3000/auth/create-admin-account?token=dev');
    });

    it('omits port in development when not provided', async () => {
        const cfg = {
            HMS_ADMIN_PANEL_HOST: 'localhost',
            APP_ENVIRONMENT: 'development',
        };

        const useCase = await makeModule(cfg);
        const url = (useCase as any).buildAdminInviteUrl('dev2');

        expect(url).toBe('http://localhost/auth/create-admin-account?token=dev2');
    });
});
