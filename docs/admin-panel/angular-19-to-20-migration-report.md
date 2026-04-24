# Technical Report: Angular 19 → 20 Migration

# Technical Report: Angular 19 → 20 Migration

Date: 2026-03-29

Executive summary

- Branch: `feat/admin-panel/deps-audit`
- Goal: reduce vulnerabilities in `app-admin-panel` while preserving runtime compatibility and, where safe, migrate from Angular 19 to Angular 20.
- Outcome: migration applied in `app-admin-panel` (Angular 20.3.x), successful build, and `npm audit` for the app reports 0 vulnerabilities after removal of a vulnerable dev-only dependency.

Context and motivation

- The repository is a monorepo; `app-admin-panel` is an isolated Angular application with its own `package.json`.
- An initial dependency audit reported five moderate vulnerabilities related to `ajv` transitively introduced by the dev tool `schematics-scss-migrate`. Applying `npm audit fix --force` would have required breaking changes. The chosen approach was to remediate without forcing runtime upgrades.

Environment

- Node: use `v20.19.0` via `nvm` (Angular CLI 20 requirement for the environment used here).
- Tools: `npm` (lockfile updated by running `npm install` inside the `app-admin-panel` workspace), Angular CLI 20.x in the app devDependencies.

Actions performed

1. Branch and preparation

- Created and used branch: `feat/admin-panel/deps-audit`.

2. Dependency audit and remediation

- Initial command: `npm --prefix app-admin-panel audit --json` → five moderate vulnerabilities (via `ajv` and `schematics-scss-migrate`).
- `npm audit fix` (non-forced) did not resolve the issues; `--force` would introduce breaking changes.
- Decision: remove the development dependency `schematics-scss-migrate` from `app-admin-panel/package.json` because it is a dev-only migration tool not required at runtime.
- Reinstall and re-audit: `npm --prefix app-admin-panel install` followed by `npm --prefix app-admin-panel audit` → 0 vulnerabilities.

3. Angular 19 → 20 migration and compatibility adjustments

- Dependency updates in `app-admin-panel/package.json`:
  - `@angular/*` updated to `20.3.18`
  - `@angular/cli` / `@angular/build` updated to `20.3.x`
  - `@angular/material` and `@angular/cdk` synchronized to `20.2.x`
  - Third-party libraries adjusted for Angular 20 compatibility:
    - `ngx-device-detector` → `10.1.0`
    - `ngx-mask` → `20.0.0`
    - `ngx-cookie-service` → `20.1.1`
    - `ngx-image-cropper` → `9.1.6`
    - `ngx-file-drop` → `16.0.0`

- Code changes applied for compatibility:
  - `app-admin-panel/src/app/app.module.ts`: replaced direct `TranslateHttpLoader` constructor usage with a factory `HttpLoaderFactory(http: HttpClient): TranslateLoader` to avoid loader signature mismatches.
  - `app-admin-panel/angular.json`: corrected style path for `jsoneditor.min.css` to reference `node_modules/jsoneditor/dist/jsoneditor.min.css`.
  - Shared modules (`SharedModule`, `SharedComponentsModule`, `image-handling.module.ts`): adjusted imports/exports to ensure component visibility, removed temporary workarounds (`CUSTOM_ELEMENTS_SCHEMA`), and restored strong typings for `ngx-image-cropper` and `ngx-file-drop` handlers.
  - Control-flow template migrations were applied file-by-file (for example, `game-create.component.*`) to minimize mass changes and enable manual review.
  - `tsconfig.json` for the app aligned to TypeScript 5.9.x to match Angular 20.

4. Build and verification

- Validation build command: `npm --prefix app-admin-panel run build`.
- Result: build completed successfully; artifacts written to `app-admin-panel/dist/hms-admin-panel`.

5. Docker Compose adjustment

- Container issue: `ng serve` inside the admin panel container failed with `Error: Unknown argument: disable-host-check` due to a deprecated CLI argument.
- Action taken: removed `--disable-host-check` from the admin panel container command in `docker-compose.yml`.

Key decisions and rationale

- Removing `schematics-scss-migrate` eliminated the `ajv`-related vulnerability while avoiding forced runtime upgrades.
- Avoided `npm audit fix --force` to prevent automatic breaking changes; preferred manual dependency alignment and code fixes.
- Per-file control-flow migrations reduce risk and make reviewable, incremental changes.

Relevant commits on the branch

- `62dd627` chore(admin-panel): remove schematics-scss-migrate dev dependency
- `6ad1445` fix(admin): remove deprecated CLI arg from docker-compose
- `4d10581` feat(admin-panel): angular 20 migration and compatibility fixes

Primary files modified

- `app-admin-panel/package.json`
- `app-admin-panel/package-lock.json` (updated)
- `app-admin-panel/angular.json`
- `app-admin-panel/tsconfig.json`
- `app-admin-panel/src/app/app.module.ts`
- `app-admin-panel/src/app/shared/*` (shared modules and image components)
- `docker-compose.yml`

Commands used (reproduction)

```bash
# use Node 20.19 via nvm
nvm install 20.19.0
nvm use 20.19.0

# reinstall dependencies for the admin app
npm --prefix app-admin-panel install

# run audit
npm --prefix app-admin-panel audit

# run validation build
npm --prefix app-admin-panel run build

# restart the admin-panel container after docker-compose change
docker compose up -d --build hms-admin-panel
```

Recommendations and next steps

- Run CI using `npm ci` and the project build pipeline on a clean runner to validate lockfile and build reproducibility.
- Execute unit and e2e tests for the admin app (`npm --prefix app-admin-panel run test`) to detect functional regressions from template or dependency changes.
- Review third-party library API changes (for example, `ngx-image-cropper`) for runtime behavior differences.
- Monitor frontend errors and logs in staging after deployment.

Rollback guidance

- Revert the migration commits using the repository workflow, for example with `git revert` on the commits listed above.

Attachments

- Audit JSON, build logs, and `npm install` outputs are available in the session terminal history.

End of report.
