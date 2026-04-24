import { BetterLogger } from './better-logger.service';

let instance: BetterLogger | null = null;

/**
 * Stores a reference to BetterLogger for contexts without DI,
 * such as param decorators.
 */
export function registerGlobalBetterLogger(
    logger: BetterLogger,
): void {
    instance = logger;
}

/**
 * Returns the globally registered BetterLogger instance,
 * or null when not available.
 */
export function getGlobalBetterLogger(): BetterLogger | null {
    return instance;
}
