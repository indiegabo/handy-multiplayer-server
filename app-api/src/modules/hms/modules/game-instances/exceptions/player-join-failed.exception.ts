export class PlayerJoinFailedException extends Error {
    constructor(public readonly reason: string) {
        super(`Failed to join player to game instance: ${reason}`);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}
