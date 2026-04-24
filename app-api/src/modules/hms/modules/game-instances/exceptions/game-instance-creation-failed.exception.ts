import { HttpStatus } from "@nestjs/common";

export class GameInstanceCreationFailedException extends Error {
    constructor(
        public readonly reason: string,
        public readonly status: HttpStatus,
    ) {
        super(`Failed to create game instance: ${reason}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}