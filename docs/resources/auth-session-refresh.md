# Auth Session Refresh and Device Fingerprint Policy

## Purpose

This guide describes the production policy for session durability in HMS,
including refresh-token rotation, device fingerprint validation, and
frontend refresh orchestration.

## Problem Pattern

When users report frequent forced logouts with HTTP 401 and the message
"Device verification failed", the root causes are usually:

- unstable fingerprint input (for example, direct IP changes),
- refresh endpoint flow not propagating device context,
- frontend race conditions between 401 interceptors and refresh retries.

## Backend Policy (app-api)

### 1. Stable Device Fingerprint

Access-token device fingerprint is generated from stable client fields:

- os
- browser
- deviceType
- userAgent

IP address is intentionally excluded from the fingerprint hash to reduce
false positives caused by mobile/wifi switches, proxy changes, and CDN hops.

### 2. Refresh Token Stores Device Context

On login and 2FA completion, the refresh token persists the device context
used to create the original access token.

On refresh, the backend now signs the new access token using the current
request device context (when available), and rotates refresh metadata.

### 3. Emergency Switch

The environment variable below controls strict fingerprint enforcement:

- AUTH_ENFORCE_DEVICE_FP=true (default)

If set to false, the backend skips the hard mismatch rejection and avoids
forced logout loops. This is intended as a temporary emergency fallback,
not a permanent baseline.

## Frontend Policy (app-admin-panel)

### 1. Single In-Flight Refresh

The auth interceptor must deduplicate refresh requests. When multiple API
calls fail with 401 simultaneously, only one refresh request is performed,
and pending requests wait for the same token result.

### 2. Refresh Endpoint Whitelist

The refresh endpoint must be excluded from auth-header injection/retry loops.
For admin panel flows, keep these routes whitelisted:

- /admin-auth/login
- /admin-auth/login-ott
- /admin-auth/refresh-token
- /admin-auth/logout

### 3. Error Interceptor Coordination

Global error handling must respect per-request suppression for refresh calls,
so failed refresh does not trigger duplicate logout side effects.

## Operational Recommendations

- Keep admin access token short or medium (for example 12h to 24h).
- Keep refresh window longer (for example 14d to 30d).
- Keep multiple refresh rotations enabled for admin users.
- Monitor frequency of 401 Device verification failed after deployment.

## Validation Checklist

1. Login in admin panel and perform normal navigation.
2. Force access-token expiration and validate transparent refresh.
3. Open multiple tabs and trigger concurrent requests.
4. Switch network (wifi/mobile hotspot) and verify session continuity.
5. Confirm refresh rotation updates both access and refresh tokens.

## Guidance for AI Agents in Other Projects

When porting this pattern to another codebase, apply this sequence:

1. Detect where fingerprint mismatch is enforced.
2. Confirm which fields are hashed and remove unstable fields first.
3. Ensure refresh flow receives and/or restores device context.
4. Persist device metadata in refresh token storage.
5. Implement single in-flight refresh in frontend interceptor.
6. Prevent refresh endpoint from entering recursive auth retries.
7. Add an emergency toggle for strict device enforcement.
8. Document rollback and production verification steps.

This sequence minimizes user-impacting logout loops while keeping a clear
security control path for stricter environments.
