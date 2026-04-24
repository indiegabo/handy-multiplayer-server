import { Test, TestingModule } from '@nestjs/testing';

import { ListAdminUsersUseCase } from
    '../../../../../../../../src/modules/hms/modules/users/use-cases/admin-users/list-admin-users.usecase';
import { AdminUsersRepository } from
    '../../../../../../../../src/modules/hms/modules/users/repositories/admin-users.repository';
import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { AdminUser } from
    '../../../../../../../../src/modules/hms/modules/users/entities/admin-user.entity';

// Mock mapper to keep the spec decoupled from mapping details.
jest.mock('../../../../../../../../src/modules/hms/modules/users/mappers/admin-user.mapper', () => ({
    mapAdminUserToViewDto: (u: any) => ({ id: u.id }),
}));

// Mock paginateQueryBuilder; controlled per-test.
const paginateQueryBuilderMock = jest.fn();
jest.mock('@hms-module/core/api/pagination/paginate-querybuilder', () => ({
    paginateQueryBuilder: (...args: any[]) => paginateQueryBuilderMock(...args),
}));

describe('ListAdminUsersUseCase', () => {
    let useCase: ListAdminUsersUseCase;

    let adminRepo: jest.Mocked<AdminUsersRepository>;
    let mediaService: jest.Mocked<MediaService>;

    function createAdminRepoMock(): jest.Mocked<AdminUsersRepository> {
        return {
            buildAdminUsersListQb: jest.fn(),
        } as unknown as jest.Mocked<AdminUsersRepository>;
    }

    function createMediaServiceMock(): jest.Mocked<MediaService> {
        return {
            attachToView: jest.fn(),
        } as unknown as jest.Mocked<MediaService>;
    }

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ListAdminUsersUseCase,
                { provide: AdminUsersRepository, useValue: createAdminRepoMock() },
                { provide: MediaService, useValue: createMediaServiceMock() },
            ],
        }).compile();

        useCase = module.get(ListAdminUsersUseCase);
        adminRepo = module.get(
            AdminUsersRepository,
        ) as jest.Mocked<AdminUsersRepository>;
        mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    });

    describe('execute', () => {
        it('should paginate, attach media and return enriched items', async () => {
            const qb: any = { tag: 'AdminQB' };
            const filters: any = {
                term: 'ali',
                page: 2,
                per_page: 10,
                sort: [{ field: 'email', direction: 'desc' }],
            };

            adminRepo.buildAdminUsersListQb.mockReturnValue(qb);

            paginateQueryBuilderMock.mockResolvedValue({
                items: [{ id: 'a1' }, { id: 'a2' }],
                meta: { page: 2, per_page: 10, total: 2, total_pages: 1 },
            });

            const enriched = [
                {
                    id: 'a1',
                    profile_picture: { id: 'm1', url: 'https://cdn/a1.png' },
                },
                {
                    id: 'a2',
                    profile_picture: { id: 'm2', url: 'https://cdn/a2.png' },
                },
            ];

            mediaService.attachToView.mockResolvedValue(enriched as any);

            const result = await useCase.execute(filters);

            expect(adminRepo.buildAdminUsersListQb).toHaveBeenCalledWith(filters);

            expect(paginateQueryBuilderMock).toHaveBeenCalledTimes(1);
            const [_qb, _filters, options] =
                paginateQueryBuilderMock.mock.calls[0];

            expect(_qb).toBe(qb);
            expect(_filters).toBe(filters);

            expect(options.perPageDefault).toBe(20);
            expect(options.perPageMax).toBe(100);
            expect(options.allowedSort).toEqual(
                expect.objectContaining({
                    id: 'au.id',
                    email: 'au.email',
                    name: 'au.name',
                    is_owner: 'au.is_owner',
                    became_owner_at: 'au.became_owner_at',
                    created_at: 'au.created_at',
                    updated_at: 'au.updated_at',
                }),
            );
            expect(options.defaultSort).toEqual([
                { field: 'created_at', direction: 'asc' },
                { field: 'email', direction: 'asc' },
            ]);

            expect(mediaService.attachToView).toHaveBeenCalledWith(
                AdminUser.name,
                [{ id: 'a1' }, { id: 'a2' }],
                ['profile'],
                {
                    fieldMap: { profile: 'profile_picture' },
                    singletons: ['profile'],
                },
            );

            expect(result.items).toEqual(enriched);
            expect(result.meta.page).toBe(2);
            expect(result.meta.per_page).toBe(10);
        });

        it('should return as-is when pagination returns empty items', async () => {
            const qb: any = { tag: 'AdminQB' };
            const filters: any = { page: 1, per_page: 20 };

            adminRepo.buildAdminUsersListQb.mockReturnValue(qb);

            const emptyResult = {
                items: [] as any[],
                meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
            };

            paginateQueryBuilderMock.mockResolvedValue(emptyResult);

            const result = await useCase.execute(filters);

            expect(adminRepo.buildAdminUsersListQb).toHaveBeenCalledWith(filters);
            expect(paginateQueryBuilderMock).toHaveBeenCalled();

            expect(mediaService.attachToView).not.toHaveBeenCalled();

            expect(result).toEqual(emptyResult);
        });
    });
});
