import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    PaginatedResult,
    UserBackofficeViewDto,
} from '@hms/shared-types/hms';

import { UsersBackofficeController } from
    '@hms-module/modules/users/controllers/users-backoffice.controller';
import { EndUsersFacade } from
    '@hms-module/modules/users/facades/end-users.facade';
import { ApiResponseInterceptor } from
    '@hms-module/core/api/api-response.interceptor';
import { MockAdminAuthMiddleware } from '../../utils/mock-admin-auth.middleware';
import { AllowAllGuard } from '../../utils/allow-all.guard';

describe('UsersBackofficeController (e2e)', () => {
    let app: ReturnType<TestingModule['createNestApplication']>;

    const facadeMock = {
        list: jest.fn(),
        getById: jest.fn(),
        getByUsername: jest.fn(),
    };

    const pagePayload: PaginatedResult<UserBackofficeViewDto> = {
        items: [
            {
                id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
                admin_id: undefined,
                email: 'eve@enduser.com',
                username: 'eve',
                display_name: 'Eve',
                two_factor_enabled: false,
                profile_picture: undefined,
            },
            {
                id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
                admin_id: undefined,
                email: 'mallory@enduser.com',
                username: 'mallory',
                display_name: 'Mallory',
                two_factor_enabled: true,
                profile_picture: undefined,
            },
        ],
        meta: {
            page: 2,
            per_page: 2,
            total: 5,
            total_pages: 3,
        },
    };

    const userById: UserBackofficeViewDto = {
        id: '11111111-1111-4111-8111-111111111111',
        admin_id: undefined,
        email: 'alice@enduser.com',
        username: 'alice',
        display_name: 'Alice',
        two_factor_enabled: true,
        profile_picture: undefined,
    };

    const userByUsername: UserBackofficeViewDto = {
        id: '22222222-2222-4222-8222-222222222222',
        admin_id: undefined,
        email: 'bob@enduser.com',
        username: 'bob',
        display_name: 'Bob',
        two_factor_enabled: false,
        profile_picture: undefined,
    };

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test
            .createTestingModule({
                controllers: [UsersBackofficeController],
                providers: [
                    { provide: EndUsersFacade, useValue: facadeMock },
                    { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
                ],
            })
            .compile();

        app = moduleFixture.createNestApplication();

        app.useGlobalPipes(
            new ValidationPipe({
                transform: true,
                whitelist: false,
            }),
        );

        app.use(new MockAdminAuthMiddleware().use);
        app.useGlobalGuards(new AllowAllGuard());

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET /users/backoffice/all → 200 with { data, meta }', async () => {
        facadeMock.list.mockResolvedValueOnce(pagePayload);

        const res = await request(app.getHttpServer())
            .get('/users/backoffice/all')
            .query({ page: 2, per_page: 2, term: 'eve' })
            .expect(200);

        expect(res.body).toEqual(
            expect.objectContaining({
                data: expect.any(Array),
                meta: expect.objectContaining({
                    page: 2,
                    per_page: 2,
                    total: 5,
                    total_pages: 3,
                }),
            }),
        );

        expect(res.body.data[0]).toEqual(
            expect.objectContaining({
                id: expect.any(String),
                email: 'eve@enduser.com',
                username: 'eve',
                two_factor_enabled: false,
            }),
        );

        expect(facadeMock.list).toHaveBeenCalledWith(
            expect.objectContaining({
                page: 2,
                per_page: 2,
                term: 'eve',
            }),
        );
    });

    it('GET /users/backoffice/all without query → passes {} to facade',
        async () => {
            facadeMock.list.mockResolvedValueOnce({
                items: [],
                meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
            });

            const res = await request(app.getHttpServer())
                .get('/users/backoffice/all')
                .expect(200);

            expect(res.body.meta).toEqual(
                expect.objectContaining({
                    page: 1,
                    per_page: 20,
                }),
            );

            expect(facadeMock.list).toHaveBeenCalledWith({});
        });

    it('GET /users/backoffice/all with multi-sort → flat keys forwarded',
        async () => {
            facadeMock.list.mockResolvedValueOnce(pagePayload);

            await request(app.getHttpServer())
                .get('/users/backoffice/all')
                .query({
                    page: 1,
                    per_page: 10,
                    'sort[0][field]': 'email',
                    'sort[0][direction]': 'asc',
                    'sort[1][field]': 'username',
                    'sort[1][direction]': 'desc',
                })
                .expect(200);

            expect(facadeMock.list).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    per_page: 10,
                    'sort[0][field]': 'email',
                    'sort[0][direction]': 'asc',
                    'sort[1][field]': 'username',
                    'sort[1][direction]': 'desc',
                }),
            );
        });

    it('GET /users/backoffice/:id → 200 with data', async () => {
        facadeMock.getById.mockResolvedValueOnce(userById);

        const res = await request(app.getHttpServer())
            .get('/users/backoffice/11111111-1111-4111-8111-111111111111')
            .expect(200);

        expect(res.body).toEqual(
            expect.objectContaining({
                data: expect.objectContaining({
                    id: '11111111-1111-4111-8111-111111111111',
                    email: 'alice@enduser.com',
                    username: 'alice',
                    two_factor_enabled: true,
                }),
            }),
        );

        expect(facadeMock.getById).toHaveBeenCalledWith(
            '11111111-1111-4111-8111-111111111111',
        );
    });

    it('GET /users/backoffice/:id with invalid UUID → 400', async () => {
        await request(app.getHttpServer())
            .get('/users/backoffice/not-a-uuid')
            .expect(400);
    });

    it('GET /users/backoffice/by-username/:username → 200 with data',
        async () => {
            facadeMock.getByUsername.mockResolvedValueOnce(userByUsername);

            const res = await request(app.getHttpServer())
                .get('/users/backoffice/by-username/bob')
                .expect(200);

            expect(res.body).toEqual(
                expect.objectContaining({
                    data: expect.objectContaining({
                        id: '22222222-2222-4222-8222-222222222222',
                        email: 'bob@enduser.com',
                        username: 'bob',
                        two_factor_enabled: false,
                    }),
                }),
            );

            expect(facadeMock.getByUsername).toHaveBeenCalledWith('bob');
        });
});
