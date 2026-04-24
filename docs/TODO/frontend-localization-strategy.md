# Localization Hosting Strategy for sg-server

> Status (alpha): The implemented solution is now documented at
> `docs/resources/i18n-hms-api-integration.md`.
>
> This TODO file keeps long-term ideas (CDN/S3/versioned publishing), but the
> current runtime behavior is filesystem-based and centralized in the HMS i18n
> module.

## Context

The `sg-server` project is responsible for serving hosted text localization
assets consumed by `sg-launcher`.

The server must expose translation manifests and locale bundles in a way that is
stable, cacheable, versioned, and safe for clients to consume at startup.

## Goals

- Serve translation payloads remotely for client-side consumption.
- Provide a manifest that describes available locales and bundle metadata.
- Support versioning and cache control for translation assets.
- Allow safe updates without requiring a launcher rebuild.
- Keep the contract simple and deterministic for Electron clients.

## Recommended API Shape

### 1. Manifest endpoint

Expose a manifest that lists supported locales and bundle metadata.

Suggested endpoint:

- GET /i18n/manifest

Example response:

{
"version": "2026.04.04.1",
"defaultLocale": "en-US",
"locales": {
"pt-BR": {
"url": "https://cdn.example.com/i18n/pt-BR.json",
"hash": "sha256-abc123",
"etag": "\"abc123\""
},
"en-US": {
"url": "https://cdn.example.com/i18n/en-US.json",
"hash": "sha256-def456",
"etag": "\"def456\""
}
}
}

### 2. Locale bundle endpoint

Expose one resource per locale.

Suggested endpoint:

- GET /i18n/:locale

Example:

- GET /i18n/pt-BR
- GET /i18n/en-US

Example response:

{
"app.title": "Streaming Games",
"app.loading": "Carregando...",
"app.retry": "Tentar novamente"
}

## Storage Model

The server should store localization assets in a way that supports:

- semantic versioning or build versioning;
- atomic updates;
- rollback to a previous known-good version;
- clear separation between manifest data and locale payloads.

Recommended storage layout conceptually:

- manifest
- locales/pt-BR.json
- locales/en-US.json
- locales/fr-FR.json

## Versioning Rules

- Every published manifest should include a version identifier.
- Locale bundles should be immutable once published for a given version.
- A new translation update should produce a new manifest version.
- Clients should be able to safely compare versions and decide whether to
  refresh their cache.

## Cache and CDN Considerations

If the server is fronted by a CDN:

- serve locale bundles with long-lived cache headers when immutable;
- serve the manifest with short cache TTL or revalidation headers;
- use ETag and/or content hashes for integrity checks;
- ensure clients can revalidate efficiently without downloading unchanged
  payloads.

Recommended HTTP behavior:

- Manifest:
  - short TTL
  - ETag
  - Cache-Control: no-cache or low TTL
- Locale bundles:
  - long TTL
  - immutable when versioned
  - content hash or ETag

## Validation Rules

Before publishing a translation bundle, validate:

- JSON syntax;
- required key coverage;
- no empty or malformed values;
- consistent locale naming conventions;
- compatibility with the launcher's expected schema.

Optional but recommended:

- automated checks for missing keys against a baseline locale;
- schema validation using JSON Schema or equivalent;
- checksum generation for bundle integrity.

## Operational Requirements

The server should support:

- fast startup and low-latency responses;
- predictable URLs;
- observability for failed downloads and missing locale requests;
- rollback in case of a bad translation publish;
- clear separation between application code and localization data.

## Security Considerations

Even though translation payloads are not highly sensitive, they should still be
treated as versioned production assets.

Recommended measures:

- HTTPS only;
- integrity hashes in the manifest;
- optional signing if translation supply-chain risk is a concern;
- strict validation on publish;
- avoid dynamic code execution from translation content.

## Suggested Internal Responsibilities

### Translation publish pipeline

- receive source localization files;
- validate schema and key coverage;
- generate hashes and version metadata;
- publish locale bundles;
- update the manifest atomically.

### Runtime server responsibilities

- serve the current manifest;
- serve locale bundles by locale code;
- return 404 for unsupported locales;
- remain deterministic and cache-friendly.

## Expected Behavior

The server should make it easy for clients to:

- discover supported languages;
- fetch the correct locale quickly;
- detect when a new translation version is available;
- continue operating correctly when some locales are missing.

## Non-goals

- Rendering UI translations inside the server.
- Coupling localization data to a specific frontend framework.
- Requiring the launcher to know internal storage details.

## Recommended Next Steps

- Define the manifest schema.
- Define the locale bundle schema.
- Implement publish/validation tooling.
- Add endpoints for manifest and locale assets.
- Add tests for versioning, locale resolution, missing locale behavior, and
  cache headers.
