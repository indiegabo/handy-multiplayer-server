import { Injectable } from "@nestjs/common";
import { UsersRepository } from "../../repositories/users.repository";
import { MediaService } from "@hms-module/modules/media/services/media.service";
import { GetEndUsersFilter } from "../../payloads/filters/get-end-users.filter";
import { PaginatedResult, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { paginateQueryBuilder } from "@hms-module/core/api/pagination/paginate-querybuilder";
import { mapUserToViewDto } from "../../mappers/user.mapper";
import { User } from "../../entities/user.entity";


/**
 * Use case for listing end users with basic filters and pagination.
 * Also attaches profile picture as MediaView when available.
 */
@Injectable()
export class ListEndUsersUseCase {
    constructor(
        private readonly usersRepo: UsersRepository,
        private readonly mediaService: MediaService,
    ) { }

    async execute(
        filters?: GetEndUsersFilter,
    ): Promise<PaginatedResult<UserBackofficeViewDto>> {
        const qb = this.usersRepo.buildEndUsersListQb(filters);
        const paginated = await paginateQueryBuilder(qb, filters, {
            mapFn: mapUserToViewDto,
            perPageDefault: 20,
            perPageMax: 100,
            allowedSort: {
                id: "u.id",
                username: "u.username",
                display_name: "u.display_name",
                email: "u.email",
                created_at: "u.created_at",
                updated_at: "u.updated_at",
            },
            defaultSort: [
                { field: "created_at", direction: "asc" },
                { field: "username", direction: "asc" },
            ],
        });

        if (!paginated.items.length) return paginated;

        const withMedia = await this.mediaService.attachToView(
            User.name,
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
