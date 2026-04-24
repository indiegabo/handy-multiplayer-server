#!/usr/bin/env node

"use strict";

const fs = require("fs");
const path = require("path");

const REPO_ROOT = path.resolve(__dirname, "..");

const HMS_SCOPE_DIRECTORIES = [
    "app-api/src/modules/hms",
    "app-api/src/config/hms",
    "app-api/test/unit/modules/hms",
    "app-api/test/e2e/core",
    "app-system/src",
    "app-system/test",
    "app-admin-panel/src/app/core/services/hms",
    "app-admin-panel/src/app/shared/hms",
    "app-admin-panel/src/app/features/setup",
    "app-admin-panel/src/app/core/exceptions",
    "app-admin-panel/src/app/core/utils",
];

const HMS_SCOPE_FILES = [
    "app-admin-panel/src/app/core/services/api-http.service.ts",
];

const FILE_EXTENSIONS = new Set([
    ".ts",
    ".js",
]);

const FORBIDDEN_RULES = [
    {
        code: "SG_CONFIG_IMPORT",
        message: "HMS scope must not import SG config paths.",
        regex: /(@src\/config\/sg\/|src\/config\/sg\/|modules\/sg\/config\/)/g,
    },
    {
        code: "SHARED_TYPES_ROOT_IMPORT",
        message: "HMS scope must import @hms/shared-types/hms instead of root barrel.",
        regex: /from\s+["']@hms\/shared-types["']/g,
    },
    {
        code: "SHARED_TYPES_SG_SURFACE_IMPORT",
        message: "HMS scope must not import @hms/shared-types/sg.",
        regex: /from\s+["']@hms\/shared-types\/sg["']/g,
    },
];

function collectSourceFiles(directoryPath, output = []) {
    if (!fs.existsSync(directoryPath)) {
        return output;
    }

    const entries = fs.readdirSync(directoryPath, {
        withFileTypes: true,
    });

    for (const entry of entries) {
        const fullPath = path.join(directoryPath, entry.name);

        if (entry.isDirectory()) {
            collectSourceFiles(fullPath, output);
            continue;
        }

        const extension = path.extname(entry.name);
        if (FILE_EXTENSIONS.has(extension)) {
            output.push(fullPath);
        }
    }

    return output;
}

function getLineNumber(content, charIndex) {
    const before = content.slice(0, charIndex);
    return before.split(/\r?\n/).length;
}

function runChecks() {
    const sourceFiles = [];

    for (const relativeDirectory of HMS_SCOPE_DIRECTORIES) {
        const fullDirectory = path.join(REPO_ROOT, relativeDirectory);
        collectSourceFiles(fullDirectory, sourceFiles);
    }

    for (const relativeFile of HMS_SCOPE_FILES) {
        const fullFile = path.join(REPO_ROOT, relativeFile);
        if (fs.existsSync(fullFile)) {
            sourceFiles.push(fullFile);
        }
    }

    const uniqueFiles = Array.from(new Set(sourceFiles));
    const violations = [];

    for (const filePath of uniqueFiles) {
        const content = fs.readFileSync(filePath, "utf8");

        for (const rule of FORBIDDEN_RULES) {
            rule.regex.lastIndex = 0;
            let match = rule.regex.exec(content);

            while (match) {
                const lineNumber = getLineNumber(content, match.index);
                const lineContent = content.split(/\r?\n/)[lineNumber - 1]?.trim() || "";

                violations.push({
                    filePath,
                    lineNumber,
                    lineContent,
                    code: rule.code,
                    message: rule.message,
                });

                match = rule.regex.exec(content);
            }
        }
    }

    if (violations.length === 0) {
        process.stdout.write("HMS boundary checks passed.\n");
        return;
    }

    process.stderr.write("HMS boundary checks failed.\n\n");

    for (const violation of violations) {
        const relativePath = path.relative(REPO_ROOT, violation.filePath);
        process.stderr.write(
            `[${violation.code}] ${relativePath}:${violation.lineNumber}\n` +
            `  ${violation.message}\n` +
            `  ${violation.lineContent}\n\n`,
        );
    }

    process.exit(1);
}

runChecks();