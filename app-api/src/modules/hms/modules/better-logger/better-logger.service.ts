import { ConsoleLogger, Injectable, Scope } from '@nestjs/common';

@Injectable({ scope: Scope.TRANSIENT })
export class BetterLogger extends ConsoleLogger {

    static readonly BLACK = '\x1b[30m';
    static readonly RED = '\x1b[31m';
    static readonly GREEN = '\x1b[32m';
    static readonly YELLOW = '\x1b[33m';
    static readonly BLUE = '\x1b[34m';
    static readonly MAGENTA = '\x1b[35m';
    static readonly CYAN = '\x1b[36m';
    static readonly WHITE = '\x1b[37m';
    static readonly BRIGHT_BLACK = '\x1b[90m';
    static readonly BRIGHT_RED = '\x1b[91m';
    static readonly BRIGHT_GREEN = '\x1b[92m';
    static readonly BRIGHT_YELLOW = '\x1b[93m';
    static readonly BRIGHT_BLUE = '\x1b[94m';
    static readonly BRIGHT_MAGENTA = '\x1b[95m';
    static readonly BRIGHT_CYAN = '\x1b[96m';
    static readonly BRIGHT_WHITE = '\x1b[97m';

    private color: string;

    constructor(context: string = '', color: string = '\x1b[36m') {
        super(context);
        this.color = color;
    }

    setMessagesColor(color: string) {
        this.color = color;
    }

    static colorize(text: string, color: string) {
        return `${color}${text}\x1b[0m`;
    }

    log(message: any, contextOrOptionalParams?: string | [...any, string?]) {
        let formattedMessage = message;
        const coloredMessage = `${this.color}${formattedMessage}\x1b[0m`;
        if (contextOrOptionalParams) {
            super.log(coloredMessage, contextOrOptionalParams);
        } else {
            super.log(coloredMessage);
        }
    }

    error(message: any, stackOrContext?: any) {
        let stack: string | undefined;
        let contextStr: string | undefined;

        // Normalize different possible inputs: Error, string, array or object
        if (stackOrContext instanceof Error) {
            stack = stackOrContext.stack;
            if (!message && stackOrContext.message) {
                message = stackOrContext.message;
            }
        } else if (typeof stackOrContext === 'string') {
            contextStr = stackOrContext;
        } else if (Array.isArray(stackOrContext)) {
            stack = stackOrContext.find(param => typeof param === 'string') as string | undefined;
            contextStr = stackOrContext.find(param => typeof param === 'string' && param !== stack) as string | undefined;
        } else if (stackOrContext && typeof stackOrContext === 'object') {
            stack = stackOrContext.stack || (stackOrContext.message ? String(stackOrContext.message) : undefined);
            try {
                contextStr = JSON.stringify(stackOrContext, Object.getOwnPropertyNames(stackOrContext));
            }
            catch {
                contextStr = String(stackOrContext);
            }
        }

        const coloredMessage = `${this.color}${message}\x1b[0m`;
        super.error(coloredMessage, stack, contextStr);

        // If the original message or provided object is an Error or object, log more details to debug
        const errObj = message instanceof Error ? message : stackOrContext instanceof Error ? stackOrContext : undefined;
        if (errObj) {
            super.debug(errObj.stack || String(errObj));
        } else if (typeof message === 'object') {
            try {
                super.debug(JSON.stringify(message, Object.getOwnPropertyNames(message)));
            }
            catch {
                super.debug(String(message));
            }
        }
    }
}