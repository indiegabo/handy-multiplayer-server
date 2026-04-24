# Game Images — Backoffice Upload and Public Fetch

This document explains:

- How backoffice uploads game images (wide / portrait)
- How public API consumers fetch game image metadata
- A reusable AI-agent prompt for third-party projects

---

## Canonical Ratios

Source: `app-shared-types/src/sg/games/game-image-ratios.ts`

- `16:9` (`GameImageRatios.WIDE_16_9`)
- `2:3` (`GameImageRatios.PORTRAIT_2_3`)

Use these values consistently in backoffice uploads and public reads.

---

## Backoffice Upload Flow

### Endpoint

- Method: `POST`
- Route: `/v1/backoffice/games/:id/images`
- Auth: admin-only (bearer token)
- Content-Type: `multipart/form-data`

Controller source:

- `app-api/src/modules/sg/modules/games/modules/backoffice/controllers/games-backoffice.controller.ts`

### Multipart fields

- `file` (binary): image payload
- `ratio` (string): `16:9` or `2:3`

### Validations

- `file` is required
- `ratio` is required
- Allowed MIME types:
  - `image/png`
  - `image/jpeg`
  - `image/jpg`
  - `image/avif`
- Max file size: 10 MB

### Uniqueness rule

Backoffice upload use case enforces one image per game+ratio in
`game_images` collection.

If a media entry already exists for the same ratio, upload returns conflict.

### Storage key pattern

Upload flow writes object keys in the format:

- `/public/games/{gameId}/images/{uuid}.{ext}`

(leading slash is accepted; URL resolution normalizes it)

### Successful response shape

The endpoint returns:

```json
{
  "success": true,
  "data": {
    "file_key": "/public/games/<gameId>/images/<uuid>.png",
    "media": {
      "id": "...",
      "type": "image",
      "filename": "...",
      "mimetype": "image/png",
      "size": 12345,
      "metadata": {
        "ratio": "16:9",
        "file_key": "/public/games/<gameId>/images/<uuid>.png"
      }
    }
  }
}
```

---

## Public Image Fetch Flow

### Endpoint

- Method: `POST`
- Route: `/v1/games/:id/image`
- Auth: public route
- Body: JSON `{ "ratio": "16:9" }` (optional)

Controller source:

- `app-api/src/modules/sg/modules/games/modules/public/controllers/games.controller.ts`

DTO source:

- `app-api/src/modules/sg/modules/games/modules/public/dtos/get-game-image.dto.ts`
- `app-api/src/modules/sg/modules/games/modules/public/dtos/game-image-response.dto.ts`

### Behavior

- If `ratio` is omitted, defaults to `16:9`.
- Server searches media attached to:
  - `entity_type = game`
  - `entity_id = :id`
  - `collection_name = game_images`
  - `metadata.ratio = requestedRatio`
- If found, server resolves `metadata.file_key` to URL and returns
  status `found` with image metadata.
- If not found, returns `200` with status `not found`.

### Response contract (`GameImageResponseDto`)

The image payload is delivered inside a `data` envelope with a mandatory
`status` field.
Real response example:

```json
{
  "data": {
    "status": "found",
    "url": "https://streaming-games-dev.s3.sa-east-1.amazonaws.com/public%2Fgames%2F33333333-3333-4333-8333-333333333333%2Fimages%2Frun-for-your-life.png",
    "filename": "run-for-your-life.png",
    "mimetype": "image/png",
    "size": 287744
  }
}
```

Not-found response example:

```json
{
  "data": {
    "status": "not found"
  }
}
```

---

## Third-Party Consumption Examples

### cURL

```bash
curl -X POST "https://<api-host>/v1/games/<game-id>/image" \
  -H "Content-Type: application/json" \
  -d '{"ratio":"16:9"}'
```

### TypeScript fetch

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message?: string | null;
};

type GameImageResponse = {
  status: "found" | "not found";
  url?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
};

export async function getGameImage(
  apiBaseUrl: string,
  gameId: string,
  ratio: "16:9" | "2:3" = "16:9",
): Promise<GameImageResponse | null> {
  const response = await fetch(`${apiBaseUrl}/v1/games/${gameId}/image`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ratio }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch game image: HTTP ${response.status}`);
  }

  const payload = (await response.json()) as ApiResponse<GameImageResponse>;

  if (!payload?.success || !payload?.data) {
    return null;
  }

  if (payload.data.status === "not found") {
    return null;
  }

  return payload.data;
}
```

---

## Prompt for External AI Agent

Use the prompt below in another project when an agent must integrate with
the HMS public game image API.

```text
You are integrating with Handy Multiplayer Server (HMS) public API.
Goal: fetch a game's image metadata for rendering a cover image.

API endpoint:
- POST /v1/games/:id/image
- Body: { "ratio": "16:9" | "2:3" }
- ratio is optional; if omitted, server defaults to 16:9.

Expected response contract:
- { success: true, data: GameImageResponseDto }
- GameImageResponseDto:
  { status: "found" | "not found", url?: string, filename?: string, mimetype?: string, size?: number }

Requirements:
1. Prefer ratio 16:9 for wide layouts and 2:3 for portrait layouts.
2. Treat `data.status = "not found"` as "image not available" (not as fatal error).
3. On non-2xx failures, log diagnostics and retry with backoff where appropriate.
4. Never construct S3 URLs manually; always trust data.url from API.
5. Return null/placeholder when image is unavailable.

Produce:
- A typed API client function
- Error handling strategy
- One usage example in UI rendering code
```

---

## Notes for Seeded Environments

For environments where images are manually uploaded to S3:

- Ensure `hms_media.metadata.file_key` matches object key in bucket.
- Ensure association exists in `game_images` collection.
- Ensure `metadata.ratio` is set (`16:9` and/or `2:3`).

Without these records, `/v1/games/:id/image` returns status `not found` even
if the file exists in S3.
