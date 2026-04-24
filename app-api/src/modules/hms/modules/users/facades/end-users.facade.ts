import { Injectable } from '@nestjs/common';
import { GetEndUsersFilter } from
    '../payloads/filters/get-end-users.filter';
import { AdminUserBackofficeViewDto, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { PaginatedResult } from '@hms-module/core/api/pagination/pagination.dto';
import { GetEndUserByUsernameUseCase } from '../use-cases/end-users/get-end-user-by-username.usecase';
import { GetEndUserByIdUseCase } from '../use-cases/end-users/get-end-user-by-id.usecase';
import { ListEndUsersUseCase } from '../use-cases/end-users/list-end-users.usecase';

/**
 * Facade exposing high-level operations for UsersController.
 */
@Injectable()
export class EndUsersFacade {
    constructor(
        private readonly useCase: ListEndUsersUseCase,
        private readonly getByIdUseCase: GetEndUserByIdUseCase,
        private readonly getByUsernameUseCase: GetEndUserByUsernameUseCase,
    ) { }

    /**
     * Lists end users with optional filters and pagination.
     */
    async list(
        filters?: GetEndUsersFilter,
    ): Promise<PaginatedResult<UserBackofficeViewDto>> {
        return this.useCase.execute(filters);
    }

    /**
     * Gets an end user by id.
     */
    async getById(id: string): Promise<UserBackofficeViewDto> {
        return this.getByIdUseCase.execute(id);
    }

    /**
     * Gets an end user by username.
     */
    async getByUsername(
        username: string,
    ): Promise<UserBackofficeViewDto> {
        return this.getByUsernameUseCase.execute(username);
    }
}
