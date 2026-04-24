// test/e2e/core/users/admin-users-backoffice.e2e-spec.ts
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

import {
    AdminUserBackofficeViewDto,
    PaginatedResult,
} from '@hms/shared-types/hms';

import { AdminUsersBackofficeController } from
    '@hms-module/modules/users/controllers/admin-users-backoffice.controller';
import { AdminUsersFacade } from
    '@hms-module/modules/users/facades/admin-users.facade';
import { ApiResponseInterceptor } from
    '@hms-module/core/api/api-response.interceptor';
import { MockAdminAuthMiddleware } from '../../utils/mock-admin-auth.middleware';
import { AllowAllGuard } from '../../utils/allow-all.guard';

describe('AdminUsersBackofficeController (e2e)', () => {
    // Keep type aligned with the createNestApplication return type.
    let app: ReturnType<TestingModule['createNestApplication']>;

    const facadeMock = {
        list: jest.fn(),
    };

    const pagePayload: PaginatedResult<AdminUserBackofficeViewDto> = {
        items: [
            {
                id: '11111111-1111-4111-8111-111111111111',
                email: 'alice.admin@example.com',
                name: 'Alice Admin',
                admin_permissions: {
                    modules: { users: true, settings: ['read'] },
                    granted_at: '2025-01-01T00:00:00.000Z',
                    granted_by: 123,
                },
                is_owner: false,
                became_owner_at: undefined,
                profile_picture: undefined,
            },
            {
                id: '22222222-2222-4222-8222-222222222222',
                email: 'bob.admin@example.com',
                name: 'Bob Admin',
                is_owner: true,
                admin_permissions: { all: true },
                became_owner_at: new Date('2025-02-01T00:00:00.000Z'),
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

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            controllers: [AdminUsersBackofficeController],
            providers: [
                { provide: AdminUsersFacade, useValue: facadeMock },
                { provide: APP_INTERCEPTOR, useClass: ApiResponseInterceptor },
            ],
        }).compile();

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

    it(
        'GET /admin-users/backoffice/all → 200 with { data, meta }',
        async () => {
            facadeMock.list.mockResolvedValueOnce(pagePayload);

            const res = await request(app.getHttpServer())
                .get('/admin-users/backoffice/all')
                .query({ page: 2, per_page: 2, term: 'alice' })
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
                    email: 'alice.admin@example.com',
                    name: 'Alice Admin',
                    is_owner: false,
                }),
            );

            expect(facadeMock.list).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 2,
                    per_page: 2,
                    term: 'alice',
                }),
            );
        },
    );

    it(
        'GET /admin-users/backoffice/all without query → passes {} to facade',
        async () => {
            facadeMock.list.mockResolvedValueOnce({
                items: [],
                meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
            });

            const res = await request(app.getHttpServer())
                .get('/admin-users/backoffice/all')
                .expect(200);

            expect(res.body.meta).toEqual(
                expect.objectContaining({
                    page: 1,
                    per_page: 20,
                }),
            );

            expect(facadeMock.list).toHaveBeenCalledWith({});
        },
    );

    it(
        'GET /admin-users/backoffice/all with multi-sort → flat keys forwarded',
        async () => {
            facadeMock.list.mockResolvedValueOnce(pagePayload);

            await request(app.getHttpServer())
                .get('/admin-users/backoffice/all')
                .query({
                    page: 1,
                    per_page: 10,
                    'sort[0][field]': 'email',
                    'sort[0][direction]': 'asc',
                    'sort[1][field]': 'name',
                    'sort[1][direction]': 'desc',
                })
                .expect(200);

            expect(facadeMock.list).toHaveBeenCalledWith(
                expect.objectContaining({
                    page: 1,
                    per_page: 10,
                    'sort[0][field]': 'email',
                    'sort[0][direction]': 'asc',
                    'sort[1][field]': 'name',
                    'sort[1][direction]': 'desc',
                }),
            );
        },
    );
});
