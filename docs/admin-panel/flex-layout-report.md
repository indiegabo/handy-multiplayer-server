# Final Report — Migration away from `@angular/flex-layout`

Date: 2026-03-29

Summary

- This migration removed direct usage of `@angular/flex-layout` inside
  the `app-admin-panel` workspace by replacing template directives
  (`fxLayout`, `fxFlex`, `fxLayoutAlign`, `fxLayoutGap`, etc.) with
  small, reusable CSS utility classes (for example: `layout-row`,
  `flex`, `align-start-center`, `gap-0-5`).
- Temporary investigation files generated during the process were
  removed. This document consolidates the final results and provides
  operational next steps.

What was done (high level)

- Created initial CSS utilities: `src/app/styles/flex-utilities.scss`
  and `src/app/styles/spacing-utilities.scss` (layout and spacing helpers).
- Conservatively replaced `fx*` occurrences with utility classes in
  multiple low-to-medium risk components.
- Removed `FlexLayoutModule` imports from Angular modules where it was
  safe to do so.
- Removed `@angular/flex-layout` from `app-admin-panel/package.json`
  after all in-package usages were converted.
- Fixed visual regressions introduced or exposed by the migration
  (for example: navigation padding, horizontal overflow in the
  `versions` view) with targeted CSS patches.

Temporary files removed

- docs/flex-layout-mapping.md
- docs/flex-layout-migration-plan.md
- docs/flex-layout-usage-details.md
- docs/flex-utilities-candidates.md
- docs/flex-utilities-candidates-raw.txt

Relevant changes (summary)

- `app-admin-panel/src/app/styles/flex-utilities.scss` — layout helpers
  (`layout-row`, `layout-column`, `.flex`, gap and alignment helpers).
- `app-admin-panel/src/app/styles/spacing-utilities.scss` — centralized
  spacing helpers (`p-*`, `m-*`).
- Multiple HTML templates — attribute `fx*` usages replaced with classes.
- `versions.component.scss` — added guards to prevent horizontal overflow
  (`min-width: 0`, `overflow: hidden`, `max-width: 100%` for inner
  elements, and constrained images/tables/pre blocks).
- Angular modules — removed `FlexLayoutModule` imports where modules no
  longer needed them.

How to validate locally

1. From the project root, install dependencies for the admin panel:

```bash
cd app-admin-panel
npm install
```

2. Start the dev server or build and inspect the UI:

```bash
npm run start
# or
npm run build
```

3. Manually verify key pages at multiple breakpoints (mobile/tablet/desktop):

- Sidebar and navigation (padding restored)
- `app/games/{id}/versions` — versions list (no horizontal overflow)
- Forms that previously used `fxFlex` / `fxLayoutGap` — ensure inputs,
  labels and alignment remain correct

Notes and risks

- The migration was intentionally conservative. Templates that used
  complex or responsive `fx*` bindings were left with TODOs for manual
  revision to avoid changing runtime semantics.
- Run unit and e2e tests (or manual QA) before creating commits or
  releasing. I did not create commits or push changes; awaiting your
  authorization for commits.

Recommended next steps

1. Run a full build and perform manual visual QA across the main views.
2. Review files flagged with TODOs where `fx*` had dynamic or
   responsive expressions and convert them manually.
3. After validation, create organized commits (I can propose commit
   messages following Conventional Commits if you want).
