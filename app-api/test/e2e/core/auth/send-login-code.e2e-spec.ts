import request from 'supertest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AuthController } from '../../../../src/modules/hms/modules/auth/controllers/auth.controller';
import { AuthFacade } from '../../../../src/modules/hms/modules/auth/auth.facade';
import { BetterLogger } from '../../../../src/modules/hms/modules/better-logger/better-logger.service';
import { UsersService } from '../../../../src/modules/hms/modules/users/services/users.service';
import { OneTimeTokensService } from '../../../../src/modules/hms/modules/one-time-tokens/one-time-tokens.service';

describe('POST /auth/send-login-code (e2e-like)', () => {
    let app: INestApplication;
    const mockAuthFacade: any = { requestEndUserLoginEmail: jest.fn() };
    const mockLogger: any = { setContext: jest.fn(), error: jest.fn(), log: jest.fn() };

    beforeAll(async () => {
        const moduleRef = await Test.createTestingModule({
            controllers: [AuthController],
            providers: [
                { provide: AuthFacade, useValue: mockAuthFacade },
                { provide: BetterLogger, useValue: mockLogger },
                { provide: UsersService, useValue: {} },
                { provide: OneTimeTokensService, useValue: {} },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn(),
                    },
                },
            ],
        }).compile();

        app = moduleRef.createNestApplication();
        app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
        await app.init();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    afterAll(async () => {
        await app.close();
    });

    it('returns 200 with recognized username and redacted email', async () => {
        mockAuthFacade.requestEndUserLoginEmail.mockResolvedValue({
            recognized_username: 'indiegabodev',
            redacted_email: 'ind****@gmail.com',
        });

        const res = await request(app.getHttpServer())
            .post('/auth/send-login-code')
            .send({ term: 'indiegabodev' })
            .expect(200);

        expect(mockAuthFacade.requestEndUserLoginEmail)
            .toHaveBeenCalledWith('indiegabodev');
        expect(res.body?.data).toEqual({
            recognized_username: 'indiegabodev',
            redacted_email: 'ind****@gmail.com',
        });
    }, 20000);

    it('returns 400 for invalid term payload', async () => {
        await request(app.getHttpServer())
            .post('/auth/send-login-code')
            .send({ term: 'bad term with spaces' })
            .expect(400);

        expect(mockAuthFacade.requestEndUserLoginEmail)
            .not.toHaveBeenCalled();
    }, 20000);
});
