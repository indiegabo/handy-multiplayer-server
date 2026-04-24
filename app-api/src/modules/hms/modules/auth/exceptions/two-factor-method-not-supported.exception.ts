import { HttpException, HttpStatus } from '@nestjs/common';

export class TwoFactorMethodNotSupportedException extends HttpException {
    constructor(message = 'Two factor method not supported') {
        super(message, HttpStatus.NOT_IMPLEMENTED);
    }
}