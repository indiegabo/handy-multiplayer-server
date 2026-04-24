# I18n Integration Guide (HMS Central Module)

## Scope

This document describes the current alpha behavior of localization delivery in
`sg-server`.

The i18n API is centralized in HMS and serves localization assets from local
filesystem paths under `app-api/src/i18n` (or `dist/i18n` in compiled runtime).

## Current Runtime Model

### 1. Root discovery

The server resolves i18n root directories in this order:

1. `app-api/src/i18n`
2. `app-api/dist/i18n`

The first existing directory is used.

### 2. Manifest location

Manifest is loaded from:

`<i18n-root>/manifest.json`

Current example:

- `app-api/src/i18n/manifest.json`

### 3. Bundle location

Bundles are resolved by this path template:

`<i18n-root>/<moduleName>/<locale>/<universe>/<namespace>.json`

Example path for SG launcher auth:

`app-api/src/i18n/sg/en/launcher/auth.json`

## API Endpoints

### Manifest endpoint

- `GET /v1/i18n/manifest`

### Bundle endpoint

- `GET /v1/i18n/:locale/:moduleName/:universe/:namespace`

Example:

- `GET /v1/i18n/en/sg/launcher/auth`

### Universe endpoint (all namespaces)

- `GET /v1/i18n/:locale/:moduleName/:universe`

Example:

- `GET /v1/i18n/en/sg/launcher`

Expected `data` payload shape:

```json
{
  "locale": "en",
  "moduleName": "sg",
  "universe": "launcher",
  "namespaces": {
    "auth": {
      "auth.title": "Sign in"
    },
    "things": {
      "things.loading": "Loading..."
    }
  }
}
```

## Response Behavior

### Envelope

Responses follow the standard API envelope:

```json
{
  "data": { "...": "..." },
  "meta": null
}
```

### Headers

Both manifest and bundles return:

- `ETag`
- `Cache-Control`

`If-None-Match` is supported and returns `304 Not Modified` when matched.

### Errors

- `404` for missing manifest file or missing bundle file.
- `500` for invalid JSON shape/content.

## Manifest Contract (Alpha)

Current expected shape:

```json
{
  "version": "alpha.0.1",
  "defaultLocale": "en",
  "modules": {
    "sg": {
      "locales": {
        "en": {
          "universes": {
            "launcher": { "namespaces": [] },
            "institutional": { "namespaces": [] },
            "sdk": { "namespaces": [] }
          }
        },
        "pt-BR": {
          "universes": {
            "launcher": { "namespaces": [] },
            "institutional": { "namespaces": [] },
            "sdk": { "namespaces": [] }
          }
        }
      }
    }
  }
}
```

Important in alpha:

- Manifest is manually maintained.
- `namespaces` arrays can stay empty while universes are being planned.
- Empty universe folders should keep a `.gitkeep` file so Git preserves them.

## How to Add a New Universe

For module `sg` and universe `<universeName>`:

1. Update `app-api/src/i18n/manifest.json` under all required locales:
   - `modules.sg.locales.<locale>.universes.<universeName>.namespaces = []`
2. Create folders:
   - `app-api/src/i18n/sg/en/<universeName>/`
   - `app-api/src/i18n/sg/pt-BR/<universeName>/`
3. Add `.gitkeep` in each new universe folder.

## How to Start Using Namespaces Later

When a universe is ready to expose a namespace:

1. Create namespace JSON files, for each locale:
   - `app-api/src/i18n/sg/en/<universe>/<namespace>.json`
   - `app-api/src/i18n/sg/pt-BR/<universe>/<namespace>.json`
2. Add namespace names to manifest arrays for each locale.
3. Consume from:
   - `/v1/i18n/<locale>/sg/<universe>/<namespace>`

## cURL Examples

```bash
# Manifest
curl -i -H "Accept: application/json" \
  http://localhost/v1/i18n/manifest

# Bundle
curl -i -H "Accept: application/json" \
  http://localhost/v1/i18n/en/sg/launcher/auth

# All namespaces in one universe
curl -i -H "Accept: application/json" \
  http://localhost/v1/i18n/en/sg/launcher

# Cache revalidation (304 expected when unchanged)
curl -i -H 'If-None-Match: "<etag-value>"' \
  http://localhost/v1/i18n/manifest
```

## Prompt Template for AI Agents (SG API Maintainers)

Use this prompt in AI agents that will modify `sg-server` itself:

```text
You are working inside sg-server.

Task:
1) Register a new i18n universe for module "sg" named "<UNIVERSE_NAME>".
2) Keep alpha mode: namespaces must remain empty arrays.
3) Update app-api/src/i18n/manifest.json for locales en and pt-BR.
4) Create folders:
   - app-api/src/i18n/sg/en/<UNIVERSE_NAME>/
   - app-api/src/i18n/sg/pt-BR/<UNIVERSE_NAME>/
5) Add .gitkeep files inside both folders.
6) Do not modify other modules or existing universes.

Acceptance criteria:
- Manifest remains valid JSON.
- New universe exists in both locales with namespaces: [].
- Both universe folders exist and are tracked by Git.
```

## Prompt Template for AI Agents (Consumer Projects)

Use this prompt in external client projects that consume SG API i18n:

```text
You are integrating this project with SG API i18n.

Requirements:
1) Set i18n moduleName to "sg".
2) Set universe to "<UNIVERSE_NAME>".
3) Load manifest from /v1/i18n/manifest and read data.modules.sg.locales.
4) Fetch all namespaces from universe endpoint:
   /v1/i18n/{locale}/sg/{universe}
5) For single-namespace fallback, support:
   /v1/i18n/{locale}/sg/{universe}/{namespace}
6) Parse API envelope shape { data, meta }.
7) Implement ETag-based revalidation support for manifest requests.
8) If namespace is missing (404), fail gracefully and log integration warning.

Output:
- Updated i18n client configuration.
- Fetch utility for manifest and namespace bundles.
- Short integration notes with endpoints used.
```
