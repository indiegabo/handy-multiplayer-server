import { HttpException, HttpStatus } from "@nestjs/common";

export class UserNotFoundException extends HttpException {
    constructor(message = 'User not found') {
        super(message, HttpStatus.NOT_FOUND);
    }
}