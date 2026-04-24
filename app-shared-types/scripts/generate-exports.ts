/* ─────────────────────────────────────────────────────────────────────
 * Auto Barrel Generator for Shared Types
 * ─────────────────────────────────────────────────────────────────────
 *
 * This script generates three barrels:
 * - src/index.ts      (legacy mixed surface)
 * - src/hms/index.ts  (HMS-only surface)
 * - src/sg/index.ts   (SG-only surface)
 */

import * as fs from 'fs';
import * as path from 'path';

interface BarrelConfig {
    sourceDir: string;
    relativeRoot: string;
    outputFile: string;
    headerTitle: string;
}

const EXCLUDED_FILE_NAMES = new Set([
    'index.ts',
]);

/**
 * Recursively collects all .ts files in a directory.
 * Excludes local index files to avoid self-referential exports.
 *
 * @param sourceDir - Directory to scan.
 * @param relativeRoot - Base directory used for relative output paths.
 * @returns List of .ts files without extension.
 */
function collectTypeFiles(
    sourceDir: string,
    relativeRoot: string,
): string[] {
    const files: string[] = [];

    if (!fs.existsSync(sourceDir)) {
        return files;
    }

    for (const entry of fs.readdirSync(sourceDir)) {
        const fullPath = path.join(sourceDir, entry);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            files.push(...collectTypeFiles(fullPath, relativeRoot));
            continue;
        }

        const isTypeScriptFile =
            entry.endsWith('.ts') &&
            !entry.endsWith('.d.ts');
        const isExcludedFile = EXCLUDED_FILE_NAMES.has(entry);

        if (!isTypeScriptFile || isExcludedFile) {
            continue;
        }

        files.push(
            path
                .relative(relativeRoot, fullPath)
                .replace(/\\/g, '/')
                .replace(/\.ts$/, ''),
        );
    }

    return files.sort((a, b) => a.localeCompare(b));
}

/**
 * Build a standard generated-file header.
 */
function buildHeader(title: string): string {
    return `/* ────────────────────────────────────────────────────────────────
* ${title}
* Do not edit manually. Run 'npm run generate:types-barrel' to update.
* ────────────────────────────────────────────────────────────────
*/\n\n`;
}

/**
 * Generates one barrel from a config descriptor.
 */
function generateBarrel(config: BarrelConfig): void {
    const files = collectTypeFiles(
        config.sourceDir,
        config.relativeRoot,
    );

    const exportsBlock = files
        .map((file) => `export * from './${file}';`)
        .join('\n');

    const content =
        buildHeader(config.headerTitle) +
        exportsBlock +
        '\n';

    fs.mkdirSync(path.dirname(config.outputFile), {
        recursive: true,
    });

    fs.writeFileSync(config.outputFile, content, 'utf8');
}

/**
 * Generates mixed and domain-specific barrel files.
 */
function generateBarrels(): void {
    const srcDir = path.join(__dirname, '../src');
    const hmsDir = path.join(srcDir, 'hms');
    const sgDir = path.join(srcDir, 'sg');

    const barrels: BarrelConfig[] = [
        {
            sourceDir: srcDir,
            relativeRoot: srcDir,
            outputFile: path.join(srcDir, 'index.ts'),
            headerTitle: 'Auto-generated barrel file for all shared types',
        },
        {
            sourceDir: hmsDir,
            relativeRoot: hmsDir,
            outputFile: path.join(hmsDir, 'index.ts'),
            headerTitle: 'Auto-generated HMS-only barrel file',
        },
        {
            sourceDir: sgDir,
            relativeRoot: sgDir,
            outputFile: path.join(sgDir, 'index.ts'),
            headerTitle: 'Auto-generated SG-only barrel file',
        },
    ];

    for (const barrel of barrels) {
        generateBarrel(barrel);
    }
}

generateBarrels();