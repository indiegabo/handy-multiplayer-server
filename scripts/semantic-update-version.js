#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const newVersion = process.argv[2];
if (!newVersion) {
    console.error('Missing version arg');
    process.exit(1);
}

function update(filePath) {
    const full = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(full)) {
        console.warn(`Skipping missing file: ${filePath}`);
        return;
    }
    const json = JSON.parse(fs.readFileSync(full, 'utf8'));
    json.version = newVersion;
    fs.writeFileSync(full, JSON.stringify(json, null, 2) + '\n', 'utf8');
    console.log(`Updated ${filePath} -> ${newVersion}`);
}

update('package.json');
update('package-lock.json');
