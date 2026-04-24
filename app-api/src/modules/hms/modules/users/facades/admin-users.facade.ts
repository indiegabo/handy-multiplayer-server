import { Injectable } from '@nestjs/common';
import { AdminUserBackofficeViewDto, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { PaginatedResult } from '@hms-module/core/api/pagination/pagination.dto';
import { GetAdminUsersFilter } from '../payloads/filters/get-admin-users.filter';
import { ListAdminUsersUseCase } from '../use-cases/admin-users/list-admin-users.usecase';

/**
 * Facade exposing high-level operations for UsersController.
 */
@Injectable()
export class AdminUsersFacade {
    constructor(
        private readonly listAdminUsersUseCase: ListAdminUsersUseCase,
    ) { }

    /**
     * Lists admin users with optional filters and pagination.
     * Reuses the same filter DTO shape for simplicity.
     */
    async list(
        filters?: GetAdminUsersFilter,
    ): Promise<PaginatedResult<AdminUserBackofficeViewDto>> {
        return this.listAdminUsersUseCase.execute(filters);
    }
}
