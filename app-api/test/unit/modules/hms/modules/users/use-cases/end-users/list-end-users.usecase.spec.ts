import { Test, TestingModule } from '@nestjs/testing';

import { ListEndUsersUseCase } from
    '../../../../../../../../src/modules/hms/modules/users/use-cases/end-users/list-end-users.usecase';
import { UsersRepository } from '../../../../../../../../src/modules/hms/modules/users/repositories/users.repository';
import { MediaService } from '@hms-module/modules/media/services/media.service';
import { User } from '../../../../../../../../src/modules/hms/modules/users/entities/user.entity';

// Mock mapper to keep the spec decoupled from mapping details.
jest.mock('../../../../../../../../src/modules/hms/modules/users/mappers/user.mapper', () => ({
    mapUserToViewDto: (u: any) => ({ id: u.id }),
}));

// Mock paginateQueryBuilder; we will control its return per test.
const paginateQueryBuilderMock = jest.fn();
jest.mock('@hms-module/core/api/pagination/paginate-querybuilder', () => ({
    paginateQueryBuilder: (...args: any[]) => paginateQueryBuilderMock(...args),
}));

describe('ListEndUsersUseCase', () => {
    let useCase: ListEndUsersUseCase;

    let usersRepo: jest.Mocked<UsersRepository>;
    let mediaService: jest.Mocked<MediaService>;

    function createUsersRepoMock(): jest.Mocked<UsersRepository> {
        return {
            buildEndUsersListQb: jest.fn(),
        } as unknown as jest.Mocked<UsersRepository>;
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
                ListEndUsersUseCase,
                { provide: UsersRepository, useValue: createUsersRepoMock() },
                { provide: MediaService, useValue: createMediaServiceMock() },
            ],
        }).compile();

        useCase = module.get(ListEndUsersUseCase);
        usersRepo = module.get(UsersRepository) as jest.Mocked<UsersRepository>;
        mediaService = module.get(MediaService) as jest.Mocked<MediaService>;
    });

    describe('execute', () => {
        it('should paginate, attach media and return enriched items', async () => {
            // Arrange
            const qb: any = { tag: 'QB' };
            const filters: any = {
                term: 'pla',
                page: 2,
                per_page: 10,
                sort: [{ field: 'username', direction: 'desc' }],
            };

            usersRepo.buildEndUsersListQb.mockReturnValue(qb);

            // The paginate mock returns already "mapped" items (ids only).
            paginateQueryBuilderMock.mockResolvedValue({
                items: [{ id: 'u1' }, { id: 'u2' }],
                meta: { page: 2, per_page: 10, total: 2, total_pages: 1 },
            });

            const enriched = [
                {
                    id: 'u1',
                    profile_picture: { id: 'm1', url: 'https://cdn/u1.png' },
                },
                {
                    id: 'u2',
                    profile_picture: { id: 'm2', url: 'https://cdn/u2.png' },
                },
            ];

            mediaService.attachToView.mockResolvedValue(enriched as any);

            // Act
            const result = await useCase.execute(filters);

            // Assert
            expect(usersRepo.buildEndUsersListQb).toHaveBeenCalledWith(filters);

            // Check paginate was invoked with qb, filters and the options.
            expect(paginateQueryBuilderMock).toHaveBeenCalledTimes(1);
            const [_qb, _filters, options] =
                paginateQueryBuilderMock.mock.calls[0];

            expect(_qb).toBe(qb);
            expect(_filters).toBe(filters);

            // Spot-check important options (not the function instance).
            expect(options.perPageDefault).toBe(20);
            expect(options.perPageMax).toBe(100);
            expect(options.allowedSort).toEqual(
                expect.objectContaining({
                    id: 'u.id',
                    username: 'u.username',
                    created_at: 'u.created_at',
                }),
            );
            expect(options.defaultSort).toEqual([
                { field: 'created_at', direction: 'asc' },
                { field: 'username', direction: 'asc' },
            ]);

            // Media enrichment.
            expect(mediaService.attachToView).toHaveBeenCalledWith(
                User.name,
                [{ id: 'u1' }, { id: 'u2' }],
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
            // Arrange
            const qb: any = { tag: 'QB' };
            const filters: any = { page: 1, per_page: 20 };

            usersRepo.buildEndUsersListQb.mockReturnValue(qb);

            const emptyResult = {
                items: [] as any[],
                meta: { page: 1, per_page: 20, total: 0, total_pages: 0 },
            };

            paginateQueryBuilderMock.mockResolvedValue(emptyResult);

            // Act
            const result = await useCase.execute(filters);

            // Assert
            expect(usersRepo.buildEndUsersListQb).toHaveBeenCalledWith(filters);
            expect(paginateQueryBuilderMock).toHaveBeenCalled();

            // No media enrichment when there are no items.
            expect(mediaService.attachToView).not.toHaveBeenCalled();

            expect(result).toEqual(emptyResult);
        });
    });
});
