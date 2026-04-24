import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { BetterLogger } from '@hms-module/modules/better-logger/better-logger.service';

export type ShutdownRoutine = () => Promise<void>;

@Injectable()
export class ShutdownService implements OnApplicationShutdown {

    private routines: ShutdownRoutine[] = [];
    timeout: 10000;

    constructor(
        private readonly appLogger: BetterLogger
    ) {
        this.appLogger.setContext(ShutdownService.name);
        this.appLogger.setMessagesColor(BetterLogger.BRIGHT_GREEN);
    }

    async onApplicationShutdown(signal?: string) {
        await this.executeShutdownRoutines();
    }

    registerShutdownRoutine(routine: ShutdownRoutine): void {
        this.routines.push(routine);
    }

    /**
     * Execute all registered shutdown routines.
     *
     * Shutdown routines are functions that are guaranteed to be executed
     * before the application is shut down. They are useful for cleaning up
     * resources that should be released before the application is exited.
     *
     * Shutdown routines are executed in the order they were registered.
     */
    async executeShutdownRoutines(): Promise<void> {
        this.appLogger.log('Executing shutdown routines');

        // Execute all shutdown routines
        await Promise.all(this.routines.map(routine => routine()));

        this.appLogger.log('Shutdown routines executed');
    }
}
