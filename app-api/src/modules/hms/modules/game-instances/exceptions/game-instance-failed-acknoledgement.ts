export class GameInstanceFailedAcknowledgementException extends Error {
    constructor(evt: string, payload?: any) {
        const message = payload
            ? `Game instance failed to acknowledge event ${evt} with payload ${JSON.stringify(payload)}`
            : `Game instance failed to acknowledge event ${evt}`;
        super(message);
        this.name = this.constructor.name;
        Error.captureStackTrace(this, this.constructor);
    }
}

