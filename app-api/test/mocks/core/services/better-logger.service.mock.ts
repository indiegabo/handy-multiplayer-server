// test/services/better-logger.service.mock.ts
export class BetterLoggerServiceMock {
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

    logs: string[] = [];
    errors: { message: string; stack?: string; context?: string }[] = [];
    debugs: string[] = [];
    warns: string[] = [];
    verboses: string[] = [];

    private context: string = '';
    private color: string = BetterLoggerServiceMock.CYAN;

    constructor(context: string = '', color: string = BetterLoggerServiceMock.CYAN) {
        this.context = context;
        this.color = color;
    }

    setContext = jest.fn((context: string) => {
        this.context = context;
        return context;
    });

    setMessagesColor = jest.fn((color: string) => {
        this.color = color;
    });

    static colorize(text: string, color: string) {
        return `${color}${text}\x1b[0m`;
    }

    log = jest.fn((message: any, contextOrOptionalParams?: string | [...any, string?]) => {
        let formattedMessage = message;
        const coloredMessage = `${this.color}${formattedMessage}\x1b[0m`;
        this.logs.push(coloredMessage);
    });

    error = jest.fn((message: any, stackOrContext?: string | [...any, string?]) => {
        let stack: string | undefined;
        let errorContext: string | undefined;

        if (typeof stackOrContext === 'string') {
            stack = stackOrContext;
        } else if (Array.isArray(stackOrContext)) {
            stack = stackOrContext.find(param => typeof param === 'string');
            errorContext = stackOrContext.find(param => typeof param === 'string' && param !== stack);
        }

        const coloredMessage = `${this.color}${message}\x1b[0m`;
        this.errors.push({
            message: coloredMessage,
            stack,
            context: errorContext
        });
    });

    debug = jest.fn((message: any, context?: string) => {
        this.debugs.push(message);
    });

    warn = jest.fn((message: any, context?: string) => {
        this.warns.push(message);
    });

    verbose = jest.fn((message: any, context?: string) => {
        this.verboses.push(message);
    });

    // Helper methods for testing
    clearLogs() {
        this.logs = [];
        this.errors = [];
        this.debugs = [];
        this.warns = [];
        this.verboses = [];
    }

    getLastLog() {
        return this.logs[this.logs.length - 1];
    }

    getLastError() {
        return this.errors[this.errors.length - 1];
    }
}