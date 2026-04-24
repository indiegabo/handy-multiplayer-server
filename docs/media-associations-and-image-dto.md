# Media Associations and ImageDTO (HMS)

This document explains how media records are stored, associated with entities,
and resolved into API-facing DTOs in HMS.

---

## Overview

HMS stores media in two layers:

1. `hms_media` (`Media` entity): binary/file metadata and custom JSON metadata.
2. `hms_media_association` (`MediaAssociation` entity): polymorphic mapping
   between a domain entity and one or more media records.

This design enables:

- Reusing media across different entities.
- Multiple named collections per entity (`profile`, `game_images`, etc.).
- Ordered lists (`position`) and singleton behavior when needed.
- Querying by metadata fields (`ratio`, tags, custom filters).

---

## Core Entities

### Media (`hms_media`)

Source: `app-api/src/modules/hms/modules/media/entities/media.entity.ts`

Main fields:

- `id` (uuid)
- `type` (`image` | `video` | `audio` | `document`)
- `filename`
- `mimetype`
- `size`
- `metadata` (jsonb)
- `created_at`, `updated_at`

Important convention for storage-backed files:

- `metadata.file_key` stores the object key/path in storage.
- The old `url` column is no longer the canonical source.

### MediaAssociation (`hms_media_association`)

Source: `app-api/src/modules/hms/modules/media/entities/media-association.entity.ts`

Main fields:

- `entity_type` (e.g. `game`)
- `entity_id` (uuid)
- `collection_name` (e.g. `game_images`)
- `media_id`
- `position` (0-based ordering)

Relevant constraints/indexes:

- Uniqueness of `(entity_type, entity_id, collection_name, media_id)`.
- Uniqueness of `(entity_type, entity_id, collection_name, position)`.

---

## Association Patterns

### Attach single media

`MediaService.attachMedia(...)` supports singleton mode (`asSingleton`):

- Deletes existing associations in the target collection.
- Inserts one media with position `0`.

### Attach collection media

When not singleton:

- Adds media at explicit `position`, or
- Appends to the next available position.

### Replace/reorder collection

- `setCollection(...)` replaces all associations by ordered IDs.
- `reorderCollection(...)` adjusts `position` with stable ordering rules.

---

## Metadata-based Lookup

`MediaService.findMediaByMetadataConditions(...)` supports filtering attached
media by `metadata` keys.

Example:

- `entity_type = game`
- `entity_id = <gameId>`
- `collection_name = game_images`
- `metadata.ratio = 16:9`

This is the mechanism used by the public game image endpoint.

---

## Storage URL Resolution

`StorageService.getResolvedUrl(fileKey)` resolves the final URL using this
priority:

1. If `fileKey` is already absolute (`http://` or `https://`), return it.
2. If `CLOUDFRONT_URL` or `AWS_S3_PUBLIC_BASE_URL` is configured, build URL
   from that base.
3. Otherwise, build S3 URL from bucket/region.
4. Fallback to presigned GET URL.

So API consumers should use the resolved URL returned by the server,
not rebuild URLs on their side.

---

## ImageDTO

Source: `app-shared-types/src/hms/media/image.dto.ts`

```ts
export type ImageDTO = {
  url: string;
  filename?: string;
  mimetype?: string;
  size?: number;
};
```

Field semantics:

- `url`: resolved URL (public/CDN/presigned), always present.
- `filename`: original or canonical file name.
- `mimetype`: media type (`image/png`, etc.).
- `size`: bytes.

### Why `ImageDTO` is simple

`ImageDTO` is intentionally minimal for external consumers:

- No internal table IDs.
- No association internals.
- No storage-provider implementation details.

It is a stable API contract for image retrieval flows.

---

## End-to-End Summary

1. Upload/finalize stores a media row with `metadata.file_key`.
2. Media gets attached to an entity collection (e.g. `game_images`).
3. Read paths query association + metadata conditions.
4. Server resolves `file_key` into URL.
5. API returns `ImageDTO`.
