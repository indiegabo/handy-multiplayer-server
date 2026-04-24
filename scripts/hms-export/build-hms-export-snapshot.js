#!/usr/bin/env node

"use strict";

/**
 * Build an HMS-only snapshot from the current sg-server repository state.
 *
 * The generated snapshot is intended to be synchronized to the standalone
 * HMS repository by CI automation. The source repository remains unchanged.
 *
 * Main responsibilities:
 * 1. Copy the repository to an isolated output directory.
 * 2. Remove SG-only directories, including SG migrations and SG seeds folders.
 * 3. Remove SG wiring from app-api/src/app.module.ts.
 * 4. Validate that SG module wiring is absent from the snapshot.
 */

const fs = require("fs");
const path = require("path");

/**
 * SG-specific paths removed from HMS snapshot.
 */
const SG_PATHS_TO_REMOVE = [
    "app-api/src/modules/sg",
    "app-api/src/config/sg",
    "app-api/src/i18n/sg",
    "app-api/src/database/migrations/sg",
    "app-api/src/database/seeds/sg",
    "app-admin-panel/src/app/features/main/sg",
    "app-admin-panel/src/app/shared/sg",
    "app-admin-panel/src/app/core/services/sg",
    "app-admin-panel/src/app/navigation/streaming-games.nav.ts",
];

/**
 * Root-level paths never copied into the export snapshot.
 */
const COPY_EXCLUDES = new Set([
    ".git",
    ".github",
    "node_modules",
    "logs",
    "app-api/logs",
    "app-system/test-reports",
]);

/**
 * Parse CLI args.
 *
 * Supported args:
 * --source <path>
 * --output <path>
 */
function parseArgs(argv) {
    const args = {
        source: process.cwd(),
        output: "",
    };

    for (let index = 2; index < argv.length; index += 1) {
        const token = argv[index];

        if (token === "--source") {
            args.source = argv[index + 1] || "";
            index += 1;
            continue;
        }

        if (token === "--output") {
            args.output = argv[index + 1] || "";
            index += 1;
            continue;
        }
    }

    if (!args.output) {
        throw new Error("Missing required argument: --output <path>");
    }

    args.source = path.resolve(args.source);
    args.output = path.resolve(args.output);

    return args;
}

/**
 * Remove and recreate a directory as an empty folder.
 */
function ensureEmptyDir(dirPath) {
    fs.rmSync(dirPath, {
        recursive: true,
        force: true,
    });

    fs.mkdirSync(dirPath, {
        recursive: true,
    });
}

/**
 * Determine whether a file/folder should be copied.
 */
function shouldCopy(sourceRoot, currentPath) {
    const relativeRaw = path.relative(sourceRoot, currentPath);

    if (!relativeRaw) {
        return true;
    }

    const relative = relativeRaw.split(path.sep).join("/");

    for (const excluded of COPY_EXCLUDES) {
        if (relative === excluded || relative.startsWith(`${excluded}/`)) {
            return false;
        }
    }

    return true;
}

/**
 * Copy source repository into output snapshot directory.
 */
function copySourceTree(sourceRoot, outputRoot) {
    fs.cpSync(sourceRoot, outputRoot, {
        recursive: true,
        force: true,
        filter: (currentPath) => shouldCopy(sourceRoot, currentPath),
    });
}

/**
 * Remove a path relative to snapshot root if it exists.
 */
function removeRelativePath(snapshotRoot, relativePath) {
    const fullPath = path.join(snapshotRoot, relativePath);

    if (!fs.existsSync(fullPath)) {
        return;
    }

    fs.rmSync(fullPath, {
        recursive: true,
        force: true,
    });
}

/**
 * Escape a string for regex construction.
 */
function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Edit a snapshot file with a transformer callback.
 */
function patchFile(snapshotRoot, relativePath, transformer) {
    const fullPath = path.join(snapshotRoot, relativePath);

    if (!fs.existsSync(fullPath)) {
        throw new Error(`Cannot patch file: ${relativePath} was not found in snapshot.`);
    }

    const original = fs.readFileSync(fullPath, "utf8");
    const patched = transformer(original);

    if (typeof patched !== "string") {
        throw new Error(`Patch transformer for ${relativePath} did not return a string.`);
    }

    if (patched !== original) {
        fs.writeFileSync(fullPath, patched, "utf8");
    }

    return patched;
}

/**
 * Remove a route block by route path in an Angular routes array.
 */
function removeRouteBlock(content, routePath) {
    const routeRegex = new RegExp(
        String.raw`\{\s*path:\s*['"]${escapeRegExp(routePath)}['"][\s\S]*?\n\s*\},\s*\n`,
        "m",
    );

    return content.replace(routeRegex, "");
}

/**
 * Remove SG module wiring from AppModule in snapshot.
 */
function stripSgFromAppModule(snapshotRoot) {
    const appModulePath = path.join(snapshotRoot, "app-api/src/app.module.ts");

    if (!fs.existsSync(appModulePath)) {
        throw new Error(
            "Cannot patch AppModule: app-api/src/app.module.ts was not found in snapshot.",
        );
    }

    const original = fs.readFileSync(appModulePath, "utf8");

    let patched = original;

    patched = patched.replace(
        /^\s*import\s+\{\s*SGModule\s*\}\s+from\s+["'][^"']*modules\/sg\/sg\.module["'];\s*\r?\n/m,
        "",
    );

    patched = patched.replace(/^\s*SGModule,\s*\r?\n/m, "");

    const stillImportsSgModule =
        /^\s*import\s+\{\s*SGModule\s*\}/m.test(patched);
    const stillRegistersSgModule = /^\s*SGModule,\s*$/m.test(patched);

    if (stillImportsSgModule || stillRegistersSgModule) {
        throw new Error(
            "Failed to strip SGModule wiring from app-api/src/app.module.ts",
        );
    }

    if (patched !== original) {
        fs.writeFileSync(appModulePath, patched, "utf8");
    }
}

/**
 * Remove SG frontend wiring from app-admin-panel in snapshot.
 */
function stripSgFromAdminPanel(snapshotRoot) {
    const mainModulePath = "app-admin-panel/src/app/features/main/main.module.ts";
    const dashboardModulePath = "app-admin-panel/src/app/features/main/dashboard/dashboard.module.ts";
    const sharedModulePath = "app-admin-panel/src/app/shared/shared.module.ts";
    const navigationConfigPath = "app-admin-panel/src/app/config/navigation.ts";

    const mainModule = patchFile(snapshotRoot, mainModulePath, (content) => {
        let patched = content;
        patched = removeRouteBlock(patched, "sg");

        patched = patched.replace(
            /\{\s*path:\s*['"]games['"][\s\S]*?redirectTo:\s*['"]sg\/games['"][\s\S]*?\},\s*\n/m,
            "",
        );

        patched = patched.replace(
            /\{\s*path:\s*['"]launcher-versions['"][\s\S]*?redirectTo:\s*['"]sg\/launcher-versions['"][\s\S]*?\},\s*\n/m,
            "",
        );

        return patched;
    });

    if (/\.\/sg\/sg\.module/.test(mainModule) || /sg\/games|sg\/launcher-versions/.test(mainModule)) {
        throw new Error(
            `Failed to strip SG routes from ${mainModulePath}`,
        );
    }

    const dashboardModule = patchFile(snapshotRoot, dashboardModulePath, (content) => {
        let patched = content;

        patched = patched.replace(
            /^\s*import\s+\{\s*SGModule\s*\}\s+from\s+['"]src\/app\/shared\/sg\/sg\.module['"];\s*\r?\n/m,
            "",
        );

        patched = patched.replace(/^\s*SGModule,\s*\r?\n/m, "");

        return patched;
    });

    if (/\bSGModule\b/.test(dashboardModule)) {
        throw new Error(
            `Failed to strip SGModule usage from ${dashboardModulePath}`,
        );
    }

    const sharedModule = patchFile(snapshotRoot, sharedModulePath, (content) => {
        let patched = content;

        patched = patched.replace(
            /^\s*import\s+\{\s*SGModule\s*\}\s+from\s+['"]\.\/sg\/sg\.module['"];\s*\r?\n/m,
            "",
        );

        patched = patched.replace(/^\s*SGModule,\s*\r?\n/gm, "");

        return patched;
    });

    if (/\bSGModule\b/.test(sharedModule) || /\.\/sg\/sg\.module/.test(sharedModule)) {
        throw new Error(
            `Failed to strip SG exports from ${sharedModulePath}`,
        );
    }

    const navigationConfig = patchFile(snapshotRoot, navigationConfigPath, (content) => {
        let patched = content;

        patched = patched.replace(
            /^\s*import\s+\{\s*streaminggamesNavigationSection\s*\}\s+from\s+['"][^'"]*streaming-games\.nav['"];\s*\r?\n/m,
            "",
        );

        patched = patched.replace(/^\s*streaminggamesNavigationSection,\s*\r?\n/m, "");

        return patched;
    });

    if (/\bstreaminggamesNavigationSection\b/.test(navigationConfig)) {
        throw new Error(
            `Failed to strip streaming games navigation section from ${navigationConfigPath}`,
        );
    }
}

/**
 * Recursively collect files in a directory.
 */
function collectFiles(dirPath, output = []) {
    if (!fs.existsSync(dirPath)) {
        return output;
    }

    const entries = fs.readdirSync(dirPath, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            collectFiles(fullPath, output);
        } else {
            output.push(fullPath);
        }
    }

    return output;
}

/**
 * Validate the generated snapshot for the most critical SG removal rules.
 */
function validateSnapshot(snapshotRoot) {
    for (const relativePath of SG_PATHS_TO_REMOVE) {
        const fullPath = path.join(snapshotRoot, relativePath);
        if (fs.existsSync(fullPath)) {
            throw new Error(
                `Validation failed: directory still exists in snapshot: ${relativePath}`,
            );
        }
    }

    const appModulePath = path.join(snapshotRoot, "app-api/src/app.module.ts");
    const appModuleContent = fs.readFileSync(appModulePath, "utf8");

    if (/\bSGModule\b/.test(appModuleContent)) {
        throw new Error(
            "Validation failed: SGModule reference still exists in app-api/src/app.module.ts",
        );
    }

    const apiSourceRoot = path.join(snapshotRoot, "app-api/src");
    const sourceFiles = collectFiles(apiSourceRoot).filter(
        (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".js"),
    );

    const leftoverSgImports = [];

    for (const filePath of sourceFiles) {
        const content = fs.readFileSync(filePath, "utf8");
        if (/(@src\/modules\/sg|modules\/sg\/)/.test(content)) {
            leftoverSgImports.push(filePath);
        }
    }

    if (leftoverSgImports.length > 0) {
        const preview = leftoverSgImports
            .slice(0, 10)
            .map((filePath) => path.relative(snapshotRoot, filePath))
            .join("\n");

        throw new Error(
            "Validation failed: SG imports still exist in snapshot source files.\n" +
            preview,
        );
    }

    const adminSourceRoot = path.join(snapshotRoot, "app-admin-panel/src/app");
    const adminSourceFiles = collectFiles(adminSourceRoot).filter(
        (filePath) => filePath.endsWith(".ts") || filePath.endsWith(".js"),
    );

    const leftoverAdminSgImports = [];

    for (const filePath of adminSourceFiles) {
        const content = fs.readFileSync(filePath, "utf8");

        if (
            /(from\s+["']src\/app\/core\/services\/sg\/|from\s+["']src\/app\/shared\/sg\/|from\s+["'][^"']*features\/main\/sg\/|\bstreaminggamesNavigationSection\b)/.test(content)
        ) {
            leftoverAdminSgImports.push(filePath);
        }
    }

    if (leftoverAdminSgImports.length > 0) {
        const preview = leftoverAdminSgImports
            .slice(0, 10)
            .map((filePath) => path.relative(snapshotRoot, filePath))
            .join("\n");

        throw new Error(
            "Validation failed: SG imports still exist in app-admin-panel snapshot source files.\n" +
            preview,
        );
    }
}

/**
 * Execute the export process.
 */
function main() {
    const args = parseArgs(process.argv);

    ensureEmptyDir(args.output);
    copySourceTree(args.source, args.output);

    for (const relativePath of SG_PATHS_TO_REMOVE) {
        removeRelativePath(args.output, relativePath);
    }

    stripSgFromAppModule(args.output);
    stripSgFromAdminPanel(args.output);
    validateSnapshot(args.output);

    process.stdout.write(
        `HMS export snapshot generated at: ${args.output}\n`,
    );
}

try {
    main();
} catch (error) {
    process.stderr.write(`HMS export snapshot failed: ${error.message}\n`);
    process.exit(1);
}
