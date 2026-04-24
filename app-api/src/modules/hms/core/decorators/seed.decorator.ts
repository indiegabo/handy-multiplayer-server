
/* ─────────────────────────────────────────────────────────────────────
 * Seed Decorator Types and Registry
 * ─────────────────────────────────────────────────────────────────────
 */

/**
 * Enum for seed execution environment.
 */
export enum SeedEnvironment {
    PRODUCTION = 'production',
    DEVELOPMENT = 'development',
}

/**
 * Enum for seed type (main or games).
 */
export enum SeedType {
    MAIN = 'main',
    GAMES = 'games',
}

/**
 * Interface for seed decorator options.
 * @property name - Unique name for the seed.
 * @property environment - Environment in which the seed should run.
 * @property type - Type of seed (main/games).
 * @property priority - Execution order (lower runs first).
 * @property repeatable - If true, runs on every startup even after
 *                        global seeding has already been completed.
 */
export interface SeedOptions {
    name: string;
    environment: SeedEnvironment;
    type: SeedType;
    priority: number;
    repeatable?: boolean;
}

/**
 * Interface for registered seed metadata.
 */
export interface RegisteredSeed {
    target: any;
    options: SeedOptions;
}

/**
 * Global registry for all decorated seeds.
 */
export const GlobalSeedRegistry: RegisteredSeed[] = [];

/**
 * Decorator to register a seed class with metadata for execution control.
 * Adds the class and its options to the global registry for later discovery.
 *
 * @param options {SeedOptions} - Metadata for the seed (name, environment, type, priority)
 * @returns {ClassDecorator}
 */
export function Seed(options: SeedOptions): ClassDecorator {
    return function (target: any) {
        GlobalSeedRegistry.push({ target, options });
    };
}
