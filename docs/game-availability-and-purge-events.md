# Game Availability and Purge Events

## Purpose

This document describes the event contracts introduced for:

- game availability changes
- asynchronous game purge execution

It also explains how each client type can consume these events:

- NestJS internal listeners
- Redis Pub/Sub listeners
- Socket.IO listeners

## Event Flow Overview

1. Any availability mutation goes through `GameAvailabilityService`.
2. `GameAvailabilityService` emits the internal Nest event
   `sg.game.availability.changed`.
3. `GameAvailabilityEventsListener` consumes that internal event and forwards it
   to:
   - Redis channel `sg:events:game:availability:changed`
   - Socket.IO namespace `/games` room `game:<gameId>`
4. Purge API request (`POST /backoffice/games/:id/purge`) sets game
   availability to `Unlisted`, emits `sg.game.purge.requested`, and returns
   immediately.
5. `GamePurgeListener` processes purge in background and emits either
   `sg.game.purge.finished` or `sg.game.purge.failed`.

## Event Catalog

### 1) Internal Nest Event: sg.game.availability.changed

Source: `GameAvailabilityService`

Payload:

```ts
{
  gameId: string;
  previousAvailability: GameAvailability;
  nextAvailability: GameAvailability;
  changed: boolean;
  changedAt: string; // ISO date string
  source: string;
  reason?: string;
  requestedByAdminId?: string;
  correlationId?: string;
}
```

### 2) Redis Channel: sg:events:game:availability:changed

Source: `GameAvailabilityEventsListener`

Message envelope:

```json
{
  "event": "sg.game.availability.changed",
  "payload": {
    "gameId": "...",
    "previousAvailability": 1,
    "nextAvailability": 5,
    "changed": true,
    "changedAt": "2026-04-23T22:00:00.000Z",
    "source": "sg.backoffice.purge.request"
  }
}
```

### 3) Socket.IO Events (/games namespace)

Source: `GameAvailabilityEventsListener` through `GameEventsGateway`

Room: `game:<gameId>`

Events:

- `availability-changed` (full payload)
- `available` (compatibility event when next availability is `Available`)
- `unavailable` (compatibility event when next availability is `Unavailable`)

Payload for all three events is the same availability payload shown above.

### 4) Internal Nest Event: sg.game.purge.requested

Source: `RequestGamePurgeUseCase`

Payload:

```ts
{
  operationId: string;
  gameId: string;
  requestedAt: string;
  requestedByAdminId?: string;
  reason?: string;
}
```

### 5) Internal Nest Event: sg.game.purge.finished

Source: `PurgeGameUseCase`

Payload:

```ts
{
  operationId: string;
  gameId: string;
  requestedAt: string;
  requestedByAdminId?: string;
  reason?: string;
  finishedAt: string;
  summary: {
    deletedGame: boolean;
    deletedVersions: number;
    deletedBuilds: number;
    deletedManagementTokens: number;
    deletedGameTesters: number;
    deletedMediaAssociations: number;
    deletedOrphanMedia: number;
  };
}
```

### 6) Internal Nest Event: sg.game.purge.failed

Source: `PurgeGameUseCase`

Payload:

```ts
{
  operationId: string;
  gameId: string;
  requestedAt: string;
  requestedByAdminId?: string;
  reason?: string;
  failedAt: string;
  errorMessage: string;
}
```

## Consumer Examples

### NestJS Internal Listener

```ts
import { Injectable } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class MyAvailabilityAuditListener {
  @OnEvent("sg.game.availability.changed", { async: true })
  async handle(payload: {
    gameId: string;
    previousAvailability: number;
    nextAvailability: number;
    changedAt: string;
    source: string;
  }): Promise<void> {
    // Persist audit log, trigger workflows, etc.
  }
}
```

### Redis Listener

```ts
import Redis from "ioredis";

const redis = new Redis({ host: process.env.REDIS_HOST, port: 6379 });

await redis.subscribe("sg:events:game:availability:changed");

redis.on("message", (channel, rawMessage) => {
  if (channel !== "sg:events:game:availability:changed") return;

  const envelope = JSON.parse(rawMessage) as {
    event: string;
    payload: {
      gameId: string;
      nextAvailability: number;
      changedAt: string;
    };
  };

  // React to availability transitions.
});
```

### Socket.IO Listener

```ts
import { io } from "socket.io-client";

const socket = io("https://api.example.com/games", {
  withCredentials: true,
});

socket.emit("join-games", ["<game-id>"]);

socket.on("availability-changed", (payload) => {
  // Full state transition payload.
});

socket.on("available", (payload) => {
  // Compatibility event for available transitions.
});

socket.on("unavailable", (payload) => {
  // Compatibility event for unavailable transitions.
});
```

## Purge API Contract

Endpoint:

- `POST /backoffice/games/:id/purge`

Behavior:

1. Set game availability to `Unlisted`.
2. Emit internal purge request event.
3. Return immediately with status 202 and operation metadata.
4. Execute actual purge asynchronously in background.

Response example:

```json
{
  "data": {
    "operation_id": "11111111-1111-4111-8111-111111111111",
    "game_id": "22222222-2222-4222-8222-222222222222",
    "status": "accepted",
    "requested_at": "2026-04-23T22:00:00.000Z"
  }
}
```
