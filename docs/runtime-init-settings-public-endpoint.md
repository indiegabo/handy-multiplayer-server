# Runtime Init Settings Public Endpoint

This document explains how client applications should consume the
public SG endpoint that exposes `sg_versions.runtime.init_settings`.
It includes request details, response shape, and TypeScript types.

---

## Overview

The endpoint returns runtime init settings pages for a specific game
version.

Each page contains:

- `metadata` (page identity and ordering info)
- `fields` (JSON object with page-specific settings)

Important:

- `values` is no longer supported for init settings pages.
- Clients must send and consume `fields` only.

---

## Endpoint

- Method: `GET`
- URL: `/v1/games/:game_id/versions/:version_id/init-settings`
- Scope: public runtime endpoint
- Path params:
  - `game_id`: game UUID v4
  - `version_id`: version UUID v4

Example:

```http
GET /v1/games/11111111-1111-4111-8111-111111111111/versions/22222222-2222-4222-8222-222222222222/init-settings HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer <TOKEN_IF_REQUIRED>
```

> Note: include `Authorization` when your environment enforces
> authenticated runtime requests.

---

## Success Response

Example response payload:

```json
{
  "data": [
    {
      "metadata": {
        "id": "window",
        "order": 1,
        "display_name": "Window"
      },
      "fields": {
        "background": true,
        "monitor_index": 1,
        "monitor": 1
      }
    },
    {
      "metadata": {
        "id": "audio",
        "order": 2,
        "display_name": "Audio"
      },
      "fields": {
        "music_volume": 0.8,
        "sfx_volume": 0.9
      }
    }
  ]
}
```

---

## Types Involved

Shared types live in `@hms/shared-types`.

```ts
export interface VersionInitSettingsPageMetadata {
  id: string;
  order: number;
  display_name?: string | null;
  display_name_i18n?: string | null;
  [key: string]: unknown;
}

export interface VersionInitSettingsPage {
  metadata: VersionInitSettingsPageMetadata;
  fields: Record<string, unknown>;
}
```

Client response type:

```ts
import { ApiResponse, VersionInitSettingsPage } from "@hms/shared-types";

export type GetVersionInitSettingsResponse = ApiResponse<
  VersionInitSettingsPage[]
>;
```

---

## cURL Example

```bash
curl -X GET \
  "https://api.example.com/v1/games/11111111-1111-4111-8111-111111111111/versions/22222222-2222-4222-8222-222222222222/init-settings" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer <TOKEN_IF_REQUIRED>"
```

---

## TypeScript (fetch) Example

```ts
import { ApiResponse, VersionInitSettingsPage } from "@hms/shared-types";

export async function getVersionInitSettings(
  api_base_url: string,
  game_id: string,
  version_id: string,
  token?: string,
): Promise<VersionInitSettingsPage[]> {
  const response = await fetch(
    `${api_base_url}/v1/games/${game_id}/versions/${version_id}/init-settings`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch init settings (${response.status})`);
  }

  const payload = (await response.json()) as ApiResponse<
    VersionInitSettingsPage[]
  >;

  return payload.data ?? [];
}
```

---

## Axios Example

```ts
import axios from "axios";
import { ApiResponse, VersionInitSettingsPage } from "@hms/shared-types";

export async function getVersionInitSettingsAxios(
  api_base_url: string,
  game_id: string,
  version_id: string,
  token?: string,
): Promise<VersionInitSettingsPage[]> {
  const response = await axios.get<ApiResponse<VersionInitSettingsPage[]>>(
    `${api_base_url}/v1/games/${game_id}/versions/${version_id}/init-settings`,
    {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    },
  );

  return response.data.data ?? [];
}
```

---

## Angular Service Example

```ts
import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, map } from "rxjs";
import { ApiResponse, VersionInitSettingsPage } from "@hms/shared-types";

@Injectable({ providedIn: "root" })
export class RuntimeInitSettingsClient {
  constructor(private readonly http: HttpClient) {}

  getInitSettings(
    api_base_url: string,
    game_id: string,
    version_id: string,
  ): Observable<VersionInitSettingsPage[]> {
    return this.http
      .get<
        ApiResponse<VersionInitSettingsPage[]>
      >(`${api_base_url}/v1/games/${game_id}/versions/${version_id}/init-settings`)
      .pipe(map((response) => response.data ?? []));
  }
}
```

---

## Expected Error Cases

Clients should handle at least:

- `400 Bad Request`
  - Invalid UUID format for `game_id` or `version_id`.
- `404 Not Found`
  - Game or version not found.
- `403 Forbidden`
  - Game availability does not allow operation.
- `401 Unauthorized`
  - Request requires authentication in your environment.

---

## Client-Side Recommendations

- Treat `data` as the source of truth.
- Sort by `metadata.order` if your UI depends on explicit ordering.
- Fallback tab labels:
  - Prefer `metadata.display_name` when present.
  - Else prefer translated `metadata.display_name_i18n` if your app has i18n mapping.
  - Fallback to `metadata.id` otherwise.
- Assume `fields` is dynamic JSON; validate only fields relevant to your app.

---

## Quick Validation Checklist

1. Use UUID v4 for both `game_id` and `version_id`.
2. Call `GET /v1/games/:game_id/versions/:version_id/init-settings`.
3. Parse `data` as `VersionInitSettingsPage[]`.
4. Handle empty array as a valid state.
5. Handle 400/401/403/404 gracefully.
