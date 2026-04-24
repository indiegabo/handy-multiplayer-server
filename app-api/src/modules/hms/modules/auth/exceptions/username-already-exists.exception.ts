import { HttpException, HttpStatus } from '@nestjs/common';

export class UsernameAlreadyExistsException extends HttpException {
    constructor(message = 'Username already exists') {
        super(message, HttpStatus.UNAUTHORIZED);
    }
}