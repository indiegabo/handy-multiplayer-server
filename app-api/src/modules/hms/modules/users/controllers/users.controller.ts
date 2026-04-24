import { Controller, Get, HttpCode, HttpStatus, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { EndUsersFacade } from '../facades/end-users.facade';


@Controller('users')
export class UsersController {
    constructor(
        private readonly endUsers: EndUsersFacade,
    ) { }
}

