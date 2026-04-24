# Launcher CI/CD Candidate Version Endpoint

This document defines the request contract used by GitHub Actions to persist
launcher candidate versions in SG.

## Purpose

The launcher development API stores candidate versions before promotion to
released channels.

The endpoint writes:

- Version identity and lifecycle state in `sg_versions`
- Candidate metadata in `sg_versions.development.candidate`
- Version-scoped semantic changelog lines (only for the version being created)

## Authentication

CI/CD endpoint is protected by the token stored in environment variable:

- `LAUNCHER_CICD_API_TOKEN`

Accepted auth headers for CI/CD:

- Preferred: `Authorization: Bearer <token>`
- Alternative: `x-launcher-cicd-token: <token>`

## Endpoint

- Method: `POST`
- Path: `/v1/launcher-development/versions/candidates`

## List Candidate Versions Endpoint

- Method: `GET`
- Path: `/v1/backoffice/launcher/versions/candidates`

Authentication for this endpoint is admin-only bearer auth.

### Success Response (List)

```json
{
  "success": true,
  "data": [
    {
      "id": "d5cd89bc-cd67-4374-8a70-57e20c9f54f5",
      "launcher_id": "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
      "semver": {
        "raw": "2.4.0-beta.2",
        "major": 2,
        "minor": 4,
        "patch": 0,
        "prerelease": "beta.2"
      },
      "state": 4,
      "is_prerelease": true,
      "channel": "beta",
      "created_at": "2026-04-14T18:35:22.000Z",
      "development": {
        "candidate": {
          "status": "candidate",
          "source": "github-actions"
        }
      }
    }
  ],
  "message": null
}
```

## Request Body

```json
{
  "semver": "2.4.0-beta.2",
  "channel": "beta",
  "branch": "beta",
  "commit_sha": "b29fc2c85452fd76d53f4f2018858c3071a63a19",
  "workflow_run_id": "14673829173",
  "workflow_run_url": "https://github.com/lung-interactive/sg-launcher/actions/runs/14673829173",
  "generated_at": "2026-04-14T18:35:22.000Z",
  "semantic_changelog": [
    "feat(updater): add rollback-safe install flow",
    "fix(download): retry transient S3 timeout for linux package"
  ],
  "artifacts": [
    {
      "platform": 1,
      "filename": "com.lung-interactive.sg-launcher-2.4.0-beta.2.exe",
      "s3_key": "candidates/launcher/beta/2.4.0-beta.2/win/launcher.exe",
      "checksum": "7ad4a2f97d3e0d8ce8f87f0f7d7336b59af501e3d0f4377f5fce8d8f56f8f3ba",
      "checksum_type": "sha256",
      "download_size": 130505728,
      "installed_size": 361721856
    }
  ]
}
```

## Field Rules

- `semver` (required): valid semantic version string.
- `channel` (required): one of `alpha`, `beta`, `latest`.
- `semantic_changelog` (required): non-empty list of notes for this version.
- `artifacts` (required): non-empty list of uploaded candidate artifacts.
- `artifacts[].platform` (required): `GameBuildPlatform` numeric enum value.
- `artifacts[].filename` (required): artifact filename.
- `artifacts[].s3_key` (required): S3 key where file was uploaded.
- `branch` (optional): git branch; defaults by channel (`main`, `beta`, `alpha`).
- `commit_sha` (optional): git SHA.
- `workflow_run_id` (optional): GitHub run id.
- `workflow_run_url` (optional): GitHub run URL.
- `generated_at` (optional): ISO timestamp from pipeline.

## Important Changelog Rule

Do not send full project changelog history.

`semantic_changelog` must include only notes for the version being persisted.

## Success Response

```json
{
  "success": true,
  "data": {
    "id": "d5cd89bc-cd67-4374-8a70-57e20c9f54f5",
    "launcher_id": "aaaaaaaa-bbbb-4ccc-dddd-eeeeeeeeeeee",
    "semver": {
      "raw": "2.4.0-beta.2",
      "major": 2,
      "minor": 4,
      "patch": 0,
      "prerelease": "beta.2"
    },
    "state": 4,
    "is_prerelease": true,
    "channel": "beta",
    "created_at": "2026-04-14T18:35:22.000Z",
    "development": {
      "candidate": {
        "status": "candidate",
        "source": "github-actions"
      }
    }
  },
  "message": null
}
```

## Error Responses

- `400 Bad Request`: invalid payload (semver, missing arrays, invalid fields).
- `401 Unauthorized`: missing or invalid CI/CD token.
- `403 Forbidden`: authenticated subject is not admin.
- `409 Conflict`: version already exists for launcher.

## Public End-User Changelog Endpoint

This endpoint is consumed by launcher runtime to fetch the markdown changelog
for a version identified by raw semver.

- Method: `POST`
- Path: `/v1/launcher/changelog/end-user`
- Authentication: public (no bearer token required)

### Request Body

```json
{
  "semver_raw": "1.0.0-alpha.19"
}
```

### Success Response

```json
{
  "success": true,
  "data": {
    "semver_raw": "1.0.0-alpha.19",
    "end_user_changelog": "## Highlights\n- Better startup flow"
  },
  "message": null
}
```

### Public Visibility Rules

- Version lookup is constrained to launcher versions in state:
  - `Released`
  - `Deprecated`
- If no public version matches `semver_raw`, API returns `404 Not Found`.
- If version exists but `notes.end_user_changelog` is missing, API returns empty
  string for `end_user_changelog`.

### Error Responses

- `400 Bad Request`: invalid payload (`semver_raw` is missing or invalid semver).
- `404 Not Found`: no released/deprecated launcher version matches semver.

## Launcher Consumption Example (TypeScript)

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string | null;
};

type EndUserChangelogRequest = {
  semver_raw: string;
};

type EndUserChangelogResponse = {
  semver_raw: string;
  end_user_changelog: string;
};

/**
 * Returns markdown changelog text for a semver, or null when not available.
 */
export async function fetchLauncherEndUserChangelog(
  apiBaseUrl: string,
  semverRaw: string,
  signal?: AbortSignal,
): Promise<string | null> {
  const payload: EndUserChangelogRequest = {
    semver_raw: semverRaw,
  };

  const response = await fetch(
    `${apiBaseUrl.replace(/\/$/, "")}/v1/launcher/changelog/end-user`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    },
  );

  // Semver not publicly available in SG.
  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Failed to fetch launcher changelog (${response.status})`);
  }

  const body = (await response.json()) as ApiResponse<EndUserChangelogResponse>;

  if (!body?.success || !body?.data) {
    return null;
  }

  const markdown = body.data.end_user_changelog;

  if (typeof markdown !== "string") {
    return null;
  }

  const normalized = markdown.trim();
  return normalized.length > 0 ? normalized : null;
}
```

## AI Agent Brief for Launcher Project

Use this exact brief when asking an AI agent in `sg-launcher` to implement
consumption:

```text
Implement launcher-side consumption for SG public endpoint:
POST /v1/launcher/changelog/end-user

Contract:
- Request body: { semver_raw: string }
- Success body: { success, data: { semver_raw, end_user_changelog }, message }
- 404 means semver is not publicly available yet.

Implementation requirements:
1. Create a dedicated HTTP service method:
   fetchLauncherEndUserChangelog(semverRaw: string): Promise<string | null>
2. Use launcher runtime semver raw as input (exact raw string).
3. Return null for 404 or empty markdown.
4. Throw/retry for transient 5xx/network errors.
5. Do not block launcher startup if endpoint fails.
6. Show changelog UI only when markdown is non-empty.
7. Cache shown changelog per semver to avoid repeated dialogs.
8. Add unit tests for:
   - 200 with markdown
   - 200 with empty markdown
   - 404
   - network/5xx failure

Keep code and comments in English and follow existing launcher architecture.
```
