import { HttpException, HttpStatus } from '@nestjs/common';

export class AuthenticationMethodNotSupportedException extends HttpException {
    constructor(message = 'Authentication method not supported') {
        super(message, HttpStatus.NOT_IMPLEMENTED);
    }
}