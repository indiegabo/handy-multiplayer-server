import { HttpException, HttpStatus } from '@nestjs/common';

export class AppNotSetup extends HttpException {
    constructor(message = 'The app is not set to use yet.') {
        super(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}