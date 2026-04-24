/* ─────────────────────────────────────────────────────────────────────
 * Seed Loader Utility
 * ─────────────────────────────────────────────────────────────────────
 */

import * as path from 'path';
import * as glob from 'glob';

/**
 * Dynamically imports all seed files in the database/seeds directory.
 * Ensures all seeds are registered via their decorators.
 *
 * @returns {Promise<void>}
 */
export async function importAllSeeds(): Promise<void> {
    const seedsDir = path.resolve(__dirname, '../../../../database/seeds');
    const files = glob.sync(`${seedsDir}/**/*.seed.{ts,js}`);
    for (const file of files) {
        require(file);
    }
}