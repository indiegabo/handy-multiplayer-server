import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { AdminUserBackofficeViewDto, PaginatedResult, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { AdminUser } from '../entities/admin-user.entity';
import { Authenticated } from '@hms-module/core/decorators/authenticated.decorator';
import { AccessPolicy, AuthSubject } from '@hms-module/core/decorators/auth-subject.decorator';
import { GetAdminUsersFilter } from '../payloads/filters/get-admin-users.filter';
import { AdminUsersFacade } from '../facades/admin-users.facade';


@Controller('admin-users/backoffice')
export class AdminUsersBackofficeController {
    constructor(
        private readonly users: AdminUsersFacade,
    ) { }

    @Get('/all')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    @AuthSubject(AccessPolicy.AdminOnly)
    async list(
        @Authenticated() authenticated: AdminUser,
        @Query() filters?: GetAdminUsersFilter,
    ): Promise<PaginatedResult<AdminUserBackofficeViewDto>> {
        return this.users.list(filters);
    }
}

