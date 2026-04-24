import { HttpException, HttpStatus } from '@nestjs/common';

export class AlreadyExists extends HttpException {
    constructor(message = 'Entity already exists') {
        super(message, HttpStatus.BAD_REQUEST);
    }
}