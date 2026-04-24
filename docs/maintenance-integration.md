# Maintenance Integration — System Service

This document describes how frontend services should consume the System
service HTTP endpoints and Socket.IO event(s) related to platform
maintenance and status. It shows exact request shapes (DTOs), success
responses (ApiResponse envelope) and example Socket.IO payloads.

**Base URL & versioning**

- API base path prefix: `/v1` (see service versioning in main.ts).
- Default port used by the System service in local dev: `3001`.

**Notes**

- Success responses are always wrapped in the `ApiResponse<T>` envelope:

```ts
export type ApiResponse<T> = {
  data: T;
  meta?: Record<string, any>;
};
```

- The System service exposes a Socket.IO gateway that emits the
  `status` event with a payload containing system status data.
- Some endpoints require admin authorization (see each endpoint below).

**HTTP Endpoints**

- **GET /v1/system/status**
  - Auth: none (exempt from maintenance checks via `@MaintenanceExempt`).
  - Request: none.
  - Response: `ApiResponse<SystemStatusResponseDTO>`

Example types:

```ts
export enum SystemStatus {
  Up = 1,
  Down = 2,
  PreparingMaintenance = 3,
  UnderMaintenance = 4,
  Unreachable = 753159751,
  Unknown = 753159752,
  Blocked = 753159753,
}

export type SystemStatusResponseDTO = {
  status: SystemStatus;
};
```

Example success response (HTTP 200):

```json
{
  "data": {
    "status": 1
  }
}
```

- **POST /v1/system/start-maintenance**
  - Auth: Admin-only (requires admin bearer token / role).
  - Request: `StartMaintenancePayloadDTO` (JSON body).
  - Response: `ApiResponse<boolean>` (data = true on success).

Request DTO:

```ts
export class StartMaintenancePayloadDTO {
  // Preparation countdown in seconds before maintenance starts.
  preparation_duration_in_seconds!: number; // int >= 1

  // Expected maintenance duration in seconds.
  maintenance_duration_in_seconds!: number; // int >= 1
}
```

Example request (curl):

```bash
curl -X POST \
  'http://localhost:3001/v1/system/start-maintenance' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <ADMIN_TOKEN>' \
  -d '{
    "preparation_duration_in_seconds": 60,
    "maintenance_duration_in_seconds": 1800
  }'
```

Example success response (HTTP 200):

```json
{
  "data": true
}
```

Common error/status codes to handle:

- `400` — validation error (invalid DTO fields).
- `401 / 403` — missing or insufficient authorization.
- `500` — server error (internal failure while scheduling maintenance).

- **POST /v1/system/cancel-maintenance-preparation**
  - Auth: Admin-only.
  - Request: none.
  - Response: `ApiResponse<boolean>` (true on success).

- **POST /v1/system/end-maintenance**
  - Auth: Admin-only.
  - Request: none.
  - Response: `ApiResponse<boolean>` (true on success).
  - Behavior: triggers the service to start the API container and wait
    for API init signals. The service will set status `Up` when init
    completes, or keep `UnderMaintenance` if init fails/timeouts.

- **POST /v1/system/stop** and **POST /v1/system/start**
  - Auth: Admin-only.
  - Request: none.
  - Response: `ApiResponse<boolean>` (true on success).
  - Use: set the system `Down` / `Up` explicitly.

**Socket.IO: events and payloads**

- Transport: Socket.IO (default namespace `/`). CORS: origin `*`.
- Event name: `status` — emitted to all connected clients.
  - Server usage: `server.emit('status', payload)`
  - Optional single-client delivery: `server.to(clientId).emit('status', payload)`

Payload base type (shared-types):

```ts
export type SystemStatusData = {
  status: SystemStatus;
  message?: string;
  maintenance_duration_in_seconds?: number;
  preparation_time_in_seconds?: number;
};
```

Implementation notes:

- The System service may emit additional fields beyond the
  `SystemStatusData` contract (e.g. `lastDownReason`, `maintenanceError`,
  `requiresAttention`, `maintenanceStartTime`, or camelCase variants).
  Frontends should tolerate extra fields and both snake_case and
  camelCase variants when reading numeric durations/times.

Example payloads:

1. System up

```json
{
  "status": 1,
  "message": "System is fully operational"
}
```

2. Preparing maintenance (countdown)

```json
{
  "status": 3,
  "message": "Scheduled maintenance",
  "preparation_time_in_seconds": 60,
  "maintenance_duration_in_seconds": 1800
}
```

3. Under maintenance (with optional extended fields)

```json
{
  "status": 4,
  "message": "Maintenance in progress",
  "maintenance_duration_in_seconds": 1800,
  "maintenanceStartTime": "2025-07-20 14:00:00 UTC",
  "requiresAttention": true,
  "maintenanceError": "Backup failed"
}
```

**Socket.IO consumption examples**

JavaScript (Node / browser using socket.io-client):

```js
// Install: npm i socket.io-client
import { io } from "socket.io-client";

const socket = io("http://localhost:3001", {
  transports: ["websocket"],
  // If you have an auth token (not required by default):
  // auth: { token: 'Bearer <JWT>' }
});

socket.on("connect", () => {
  console.log("connected:", socket.id);
});

socket.on("status", (payload) => {
  // payload is SystemStatusData (plus optional extended fields)
  console.log("system status:", payload);
});

socket.on("disconnect", (reason) => {
  console.log("disconnected:", reason);
});
```

Angular / TypeScript (example service):

```ts
import { Injectable } from "@angular/core";
import { io, Socket } from "socket.io-client";
import { BehaviorSubject } from "rxjs";

export type SystemStatusData = {
  status: number;
  message?: string;
  maintenance_duration_in_seconds?: number;
  preparation_time_in_seconds?: number;
  [k: string]: any;
};

@Injectable({ providedIn: "root" })
export class SystemSocketService {
  private socket!: Socket;
  public status$ = new BehaviorSubject<SystemStatusData | null>(null);

  constructor() {
    this.socket = io((window as any).SYSTEM_API_URL || "http://localhost:3001");

    this.socket.on("status", (payload: SystemStatusData) => {
      this.status$.next(payload);
    });
  }

  disconnect() {
    this.socket.disconnect();
  }
}
```

**Mapping: numeric SystemStatus → meaning**

```ts
export const SystemStatusMap: Record<number, string> = {
  1: "Up",
  2: "Down",
  3: "PreparingMaintenance",
  4: "UnderMaintenance",
  753159751: "Unreachable",
  753159752: "Unknown",
  753159753: "Blocked",
};
```

**Recommendations for frontends (consumption rules)**

- Prefer reacting to Socket.IO `status` events for live UI updates.
- Use `GET /v1/system/status` as a bootstrap check (page load, polling
  fallback).
- Admin flows should call admin endpoints with a valid admin bearer
  token. Handle `401/403/400/500` gracefully.
- Accept both snake_case and camelCase fields for durations/timestamps.
- Treat extra fields as informational — don't fail on unknown keys.

**Appendix — quick DTO summary**

```ts
// ApiResponse<T>
export type ApiResponse<T> = { data: T; meta?: Record<string, any> };

// StartMaintenancePayloadDTO
export type StartMaintenancePayload = {
  preparation_duration_in_seconds: number;
  maintenance_duration_in_seconds: number;
};

// SystemStatusData (server may add extras)
export type SystemStatusData = {
  status: SystemStatus;
  message?: string;
  maintenance_duration_in_seconds?: number;
  preparation_time_in_seconds?: number;
};
```

---

If you want, I can:

- Add the same examples as ready-to-paste snippets in the
  `app-admin-panel` client code.
- Produce a short Postman collection for these endpoints.
