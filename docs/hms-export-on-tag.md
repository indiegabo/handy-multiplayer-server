# HMS Export After Release

This document describes the automated export flow that creates an HMS-only
snapshot after each successful sg-server release and opens a PR in the target
HMS repository.

## Purpose

The source repository keeps both HMS and SG development contexts.
The target repository must receive HMS-only code.

To satisfy both needs, SG removal happens only in the export pipeline output,
never as a runtime optional flag in source code.

## Trigger

Workflow file:

- `.github/workflows/ci-and-release.yml`

Trigger condition:

- A push to `main` starts `CI & Release`.
- After tests pass, semantic-release runs.
- When semantic-release publishes a new version tag, export runs as the next
  job in the same workflow.
- semantic-release authentication in source repository uses `GITHUB_TOKEN`.

## Export Steps

1. Checkout source repository at the released tag commit.
2. Build a snapshot using:
   - `scripts/hms-export/build-hms-export-snapshot.js`
3. In snapshot generation, remove SG-linked items:
   - `app-api/src/modules/sg`
   - `app-api/src/config/sg`
   - `app-api/src/i18n/sg`
   - `app-api/src/database/migrations/sg`
   - `app-api/src/database/seeds/sg`
   - `app-api/test/e2e/sg`
   - `app-api/test/unit/modules/sg`
   - `app-api/test/mocks/sg`
   - `SGModule` import/registration from `app-api/src/app.module.ts`
   - `app-admin-panel/src/app/features/main/sg`
   - `app-admin-panel/src/app/shared/sg`
   - `app-admin-panel/src/app/core/services/sg`
   - `app-admin-panel/src/app/navigation/streaming-games.nav.ts`
   - SG references in app-admin-panel root wiring files
     (`main.module.ts`, `dashboard.module.ts`, `shared.module.ts`, `config/navigation.ts`)
4. Validate snapshot buildability:
   - Run root dependency install (`npm ci`).
   - Run app-admin-panel dependency install (`npm --prefix app-admin-panel ci`).
   - Run admin panel build (`npm run build:admin`).
5. Clone target repository:
   - `indiegabo/handy-multiplayer-server`
6. Sync snapshot over target repository working tree.
7. Commit and push an automation branch.
8. Create or update a PR in target repository.

## Required Secret

Set this repository secret in `lung-interactive/sg-server`:

- `HMS_REPO_PAT`

Required access for PAT:

- `HMS_REPO_PAT`:
  - Contents: Read and Write on target repository.
  - Pull requests: Read and Write on target repository.

## Expected Output

For each released tag, automation tries to produce/update branch:

- `automation/hms-export-<tag>`

And creates/updates PR against:

- Base branch: `main`
- Repository: `indiegabo/handy-multiplayer-server`

## Notes

- If there are no file changes after snapshot sync, PR creation is skipped.
- The script validates that SG module wiring is not present in snapshot.
- The workflow validates that app-admin-panel still builds in snapshot.
- Migrations are domain-split in:
  - `app-api/src/database/migrations/hms`
  - `app-api/src/database/migrations/sg`
- Seeds are domain-split in:
  - `app-api/src/database/seeds/hms`
  - `app-api/src/database/seeds/sg`
