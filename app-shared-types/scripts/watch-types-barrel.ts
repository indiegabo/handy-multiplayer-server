/* ─────────────────────────────────────────────────────────────────────
 * Watches for changes in src/ and regenerates the barrel file.
 * ─────────────────────────────────────────────────────────────────────
 */

import chokidar from 'chokidar';
import { exec } from 'child_process';

/**
 * Watches for .ts file changes in src/ and runs the barrel generator.
 */
function watchTypesBarrel(): void {
    const watcher = chokidar.watch('src/**/*.ts', {
        ignored: [
            'src/index.ts',
            'src/hms/index.ts',
            'src/sg/index.ts',
            'dist/**',
            'node_modules/**',
        ],
        persistent: true,
        ignoreInitial: true,
    });

    let debounceTimer: NodeJS.Timeout | undefined;
    let isRunning = false;
    let hasPendingRun = false;

    watcher.on('add', scheduleGeneratorRun);
    watcher.on('unlink', scheduleGeneratorRun);
    watcher.on('change', scheduleGeneratorRun);

    /**
     * Executes the barrel generator script.
     */
    function scheduleGeneratorRun(): void {
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            void runGenerator();
        }, 250);
    }

    async function runGenerator(): Promise<void> {
        if (isRunning) {
            hasPendingRun = true;
            return;
        }

        isRunning = true;

        exec('npm run generate:types-barrel', (error, stdout, stderr) => {
            if (error) {
                console.error('Barrel generation failed:', error);
            } else {
                console.log('Barrel file regenerated.');
            }

            isRunning = false;

            if (hasPendingRun) {
                hasPendingRun = false;
                scheduleGeneratorRun();
            }
        });
    }

    console.log('Watching for type changes...');
}

watchTypesBarrel();