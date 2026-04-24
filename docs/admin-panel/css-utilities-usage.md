# CSS Utilities — Usage Guide

Date: 2026-03-29

Overview

This document explains how to use the small set of CSS utility classes
introduced to replace `@angular/flex-layout` directives inside the
`app-admin-panel` workspace. The utilities are intentionally minimal,
predictable and safe to apply incrementally.

Where the utilities live

- Layout and alignment helpers: [app-admin-panel/src/app/styles/flex-utilities.scss](app-admin-panel/src/app/styles/flex-utilities.scss)
- Spacing helpers: [app-admin-panel/src/app/styles/spacing-utilities.scss](app-admin-panel/src/app/styles/spacing-utilities.scss)

Naming conventions

- Prefixes: classes begin with `layout-`, `align-`, `gap-`, `flex-`, or
  `p-`/`m-` for spacing. This reduces naming collisions and makes intent
  explicit.
- Use short, descriptive names: `layout-row`, `align-start-center`,
  `gap-0-5`, `flex-50`, `p-05-em`.

Basic categories

1. Layout

- `layout-row` — display:flex; flex-direction: row.
- `layout-column` — display:flex; flex-direction: column.
- `layout-row-wrap` / `layout-wrap` — enable wrapping behaviour.

2. Flex sizing

- `flex` — flexible element (equivalent to `flex: 1 1 auto` with
  `min-width:0`).
- `flex-50`, `flex-33`, `flex-25`, etc. — fixed percentage basis helpers
  (use sparingly; these set `flex: 0 0 50%` etc.).
- Pixel helper: `flex-40px` — fixed 40px basis for small icon columns.

3. Alignment

- `align-start-center` — justify-content:flex-start; align-items:center.
- `align-center-center`, `align-space-between-center`, `align-end-center` —
  common combos mapped from previous `fxLayoutAlign` usages.

4. Gaps

- `gap-0-5`, `gap-1`, `gap-1-5`, ... — use `gap` when supported.
- There are also row-gap helpers for older browser fallbacks.

5. Show / Hide

- `show` / `hide` — forced display toggles. Responsive variants exist
  (`hide-sm`, `hide-md`, `show-md`). Prefer CSS over runtime toggles
  when possible.

6. Spacing utilities

- Padding: `p-05-em`, `p-1-em`, `p-1-5-em`, `p-2-em`.
- Margin: `m-05-em`, `mt-1-em`, `mb-2-em`, etc.

Examples

- Two-column layout (sidebar + content):

```html
<div class="layout-row">
  <aside class="flex-25">Sidebar</aside>
  <main class="flex">Content</main>
</div>
```

- Row with centered items and small gap:

```html
<div class="layout-row align-start-center gap-0-5">
  <div class="flex">Left</div>
  <div>Right</div>
</div>
```

- Form field that should stretch to full width inside a row:

```html
<div class="layout-row gap-0-5">
  <mat-form-field class="flex-100"> ... </mat-form-field>
</div>
```

Responsive example: show on medium-and-up only

```html
<div class="hide-sm show-md">Visible on md+</div>
```

Best practices and notes

- Prefer adding utility classes over changing DOM structure. This
  keeps changes reversible and easier to review.
- When converting a component, verify `min-width: 0` is present on
  flex children to avoid horizontal overflow. The project utilities
  already account for this in many places.
- For complex responsive behaviours or computed `fxFlex` bindings,
  leave a TODO comment and convert manually — do not guess runtime
  semantics.
- Keep component-scoped visual rules (colors, padding specific to a
  widget) inside the component SCSS. Utilities are intended for
  layout and spacing only.

Troubleshooting

- Horizontal overflow after conversion: ensure the flex child has
  `min-width:0` (use `.flex` or apply `min-width:0` in component
  stylesheet). Also verify images/tables inside the detail area use
  `max-width:100%`.
- Missing gap between items: confirm the browser supports `gap` on
  flex containers; if not, use row-gap helpers provided or fallback
  per-component padding.

Where to extend

- If you need additional utility sizes (more gap steps or percentage
  flex helpers), add them to `flex-utilities.scss`. Prefer a small
  consistent scale to avoid style explosion.

Final checklist when migrating a component

1. Add utility classes in template — prefer `class` additions only.
2. Load the app and check the layout at mobile/tablet/desktop.
3. Fix any overflow or alignment issues with `min-width:0` or
   `max-width:100%` constraints inside the component.
4. If conversion is trivial across the module, remove `FlexLayoutModule`
   import from the module file.

Questions or help

If you want, I can produce a small codemod to apply low-risk
replacements automatically, or propose commit messages for the current
changes. Which would you prefer?
