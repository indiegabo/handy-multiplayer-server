import { Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Query, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { GetEndUsersFilter } from '../payloads/filters/get-end-users.filter';
import { PaginatedResult, UserBackofficeViewDto } from "@hms/shared-types/hms";
import { AdminUser } from '../entities/admin-user.entity';
import { Authenticated } from '@hms-module/core/decorators/authenticated.decorator';
import { AccessPolicy, AuthSubject } from '@hms-module/core/decorators/auth-subject.decorator';
import { EndUsersFacade } from '../facades/end-users.facade';


@Controller('users/backoffice')
export class UsersBackofficeController {
    constructor(
        private readonly usersFacade: EndUsersFacade,
    ) { }

    @Get('/all')
    @HttpCode(HttpStatus.OK)
    @UsePipes(new ValidationPipe({ transform: true }))
    @AuthSubject(AccessPolicy.AdminOnly)
    async list(
        @Authenticated() authenticated: AdminUser,
        @Query() filters?: GetEndUsersFilter,
    ): Promise<PaginatedResult<UserBackofficeViewDto>> {
        return this.usersFacade.list(filters);
    }

    @Get('/:id')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AdminOnly)
    async getById(
        @Authenticated() _admin: AdminUser,
        @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    ): Promise<UserBackofficeViewDto> {
        return this.usersFacade.getById(id);
    }

    @Get('/by-username/:username')
    @HttpCode(HttpStatus.OK)
    @AuthSubject(AccessPolicy.AdminOnly)
    async getByUsername(
        @Authenticated() _admin: AdminUser,
        @Param('username') username: string,
    ): Promise<UserBackofficeViewDto> {
        return this.usersFacade.getByUsername(username);
    }
}

