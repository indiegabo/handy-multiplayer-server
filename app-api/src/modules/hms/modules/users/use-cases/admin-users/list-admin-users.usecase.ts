import { Injectable } from '@nestjs/common';
import { MediaService } from
    '@hms-module/modules/media/services/media.service';
import { paginateQueryBuilder } from
    '@hms-module/core/api/pagination/paginate-querybuilder';
import { PaginatedResult } from
    '@hms-module/core/api/pagination/pagination.dto';
import { AdminUsersRepository } from '../../repositories/admin-users.repository';
import { GetAdminUsersFilter } from '../../payloads/filters/get-admin-users.filter';
import { AdminUserBackofficeViewDto } from "@hms/shared-types/hms";
import { mapAdminUserToViewDto } from '../../mappers/admin-user.mapper';
import { AdminUser } from '../../entities/admin-user.entity';

@Injectable()
export class ListAdminUsersUseCase {
    constructor(
        private readonly adminRepo: AdminUsersRepository,
        private readonly mediaService: MediaService,
    ) { }

    async execute(
        filters?: GetAdminUsersFilter,
    ): Promise<PaginatedResult<AdminUserBackofficeViewDto>> {
        const qb = this.adminRepo.buildAdminUsersListQb(filters);

        const paginated = await paginateQueryBuilder(qb, filters, {
            mapFn: mapAdminUserToViewDto,
            perPageDefault: 20,
            perPageMax: 100,
            allowedSort: {
                id: 'au.id',
                email: 'au.email',
                name: 'au.name',
                is_owner: 'au.is_owner',
                became_owner_at: 'au.became_owner_at',
                created_at: 'au.created_at',
                updated_at: 'au.updated_at',
            },
            defaultSort: [
                { field: 'created_at', direction: 'asc' },
                { field: 'email', direction: 'asc' },
            ],
        });

        if (!paginated.items.length) return paginated;

        const withMedia = await this.mediaService.attachToView(
            AdminUser.name,
            paginated.items,
            ['profile'],
            {
                fieldMap: { profile: 'profile_picture' },
                singletons: ['profile'],
            },
        );

        paginated.items = withMedia;
        return paginated;
    }
}
