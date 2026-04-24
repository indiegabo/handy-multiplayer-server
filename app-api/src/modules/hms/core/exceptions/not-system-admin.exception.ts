import { HttpException, HttpStatus } from '@nestjs/common';

export class NotSystemAdminException extends HttpException {
    constructor(message = 'Not system admin') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}