# Launcher Socket / Redis Integration

This document describes the runtime contract between the HMS API (`app-api`) and the Launcher (Electron + TypeScript). It explains how the Launcher should connect to Socket.IO, which Redis keys are written by the API, the event payloads, and recommended client-side behavior (reconnect, scheduling, execution).

---

## Overview

- Namespace (Socket.IO): `/games`
- Room per game: `game:{gameId}` — Launcher should `join` rooms for games it manages.
- Events emitted by the API (to game rooms):
  - `shutdown-scheduled` — a scheduled action (shutdown or restart) for that game
  - `unavailable` — the game became unavailable now; launcher should stop the running game immediately
  - `available` — the game is now available again

- Schedule persistence: the API writes schedule entries to Redis as JSON under keys:
  - `sg:game:schedule:{scheduleId}` — JSON object describing the scheduled action
  - `sg:game:{gameId}:schedules` — Redis SET containing schedule ids for that game

All examples below assume the Launcher is built with Electron + TypeScript and uses `socket.io-client` and a small wrapper for local process control.

---

## Redis Schedule JSON format

Each schedule is stored as a JSON object. The API emits the same structure to the launchers.

Example (shutdown):

```json
{
  "id": "9f1c6b3e-...",
  "gameId": "game-uuid-123",
  "scheduledAt": "2026-04-01T00:00:00.000Z",
  "message": "critical security patch",
  "status": "scheduled",
  "action": "shutdown"
}
```

Fields:

- `id` (string): UUID of the schedule entry
- `gameId` (string): game identifier
- `scheduledAt` (ISO8601 string): when the action should happen
- `message` (optional string): human message for admins/operators
- `status` (string): `scheduled` | `executed` | `cancelled`
- `action` (string): `shutdown` | `restart`

---

## Socket events and payloads

1. `shutdown-scheduled`
   - Emitted to room `game:{gameId}` when a schedule is created.
   - Payload: the schedule JSON object (see format above).
   - Note: `action` field indicates if it is `shutdown` or `restart`.

2. `unavailable`
   - Emitted to room `game:{gameId}` when the game must be closed immediately.
   - Suggested payload example:
     ```json
     { "gameId": "game-uuid-123", "reason": "critical-vuln" }
     ```

3. `available`
   - Emitted to room `game:{gameId}` when the game is allowed again.
   - Suggested payload example:
     ```json
     { "gameId": "game-uuid-123" }
     ```

---

## Launcher behavior (recommended)

1. Connect to Socket.IO namespace `/games`.
2. After authentication (if required), `emit('join-games', [gameIdA, gameIdB])` to subscribe the launcher to rooms it manages.
3. Listen for `shutdown-scheduled`, `unavailable`, `available` events.
4. On `shutdown-scheduled`:
   - Persist the schedule locally (file or small DB) so the launcher can recover after restart.
   - If the scheduled time is near (or passed), act according to policy:
     - If `action === 'shutdown'`: gracefully stop the game process and mark schedule executed.
     - If `action === 'restart'`: gracefully stop the game, wait for process termination, then start it again.
5. On `unavailable`: immediately stop the running game process.
6. On `available`: allow starting new sessions for that game again.
7. On reconnect: rejoin rooms and reconcile local schedule state with the server (re-fetch schedule keys if needed).

---

## Electron + TypeScript example

This example shows a minimal pattern for the Renderer process (or a dedicated background worker) using `socket.io-client`.

Install dependencies (inside your launcher project):

```bash
npm install socket.io-client
```

Example TypeScript (Renderer / Background script):

```ts
// launcher-socket.ts (Electron Renderer or background worker)
import { io, Socket } from "socket.io-client";
import { spawn, ChildProcess } from "child_process";
import fs from "fs";
import path from "path";

const SOCKET_ENDPOINT = process.env.HMS_API_WS || "http://localhost:3000/games";
const PERSIST_PATH = path.join(
  process.env.APPDATA || ".",
  "launcher-schedules.json",
);

type Schedule = {
  id: string;
  gameId: string;
  scheduledAt: string;
  message?: string;
  status: string;
  action: "shutdown" | "restart";
};

class LauncherSocket {
  private socket!: Socket;
  private gameProcesses: Map<string, ChildProcess> = new Map();
  private schedules: Record<string, Schedule> = {};

  constructor(private managedGameIds: string[]) {}

  connect() {
    this.socket = io(SOCKET_ENDPOINT, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });

    this.socket.on("connect", () => {
      console.log("Socket connected", this.socket.id);
      this.socket.emit("join-games", this.managedGameIds);
      this.reconcileSchedules();
    });

    this.socket.on("shutdown-scheduled", (payload: Schedule) => {
      console.log("shutdown-scheduled", payload);
      this.onSchedule(payload);
    });

    this.socket.on("unavailable", (payload: any) => {
      console.log("unavailable", payload);
      this.stopGame(payload.gameId);
    });

    this.socket.on("available", (payload: any) => {
      console.log("available", payload);
      // allow new sessions or notify UI
    });

    this.socket.on("disconnect", (reason) => {
      console.warn("socket disconnected", reason);
    });
  }

  private saveSchedulesToDisk() {
    try {
      fs.writeFileSync(PERSIST_PATH, JSON.stringify(this.schedules, null, 2));
    } catch (err) {
      console.error("failed to save schedules", err);
    }
  }

  private loadSchedulesFromDisk() {
    try {
      if (!fs.existsSync(PERSIST_PATH)) return;
      const raw = fs.readFileSync(PERSIST_PATH, "utf8");
      this.schedules = JSON.parse(raw) as Record<string, Schedule>;
    } catch (err) {
      console.warn("failed to load schedules", err);
      this.schedules = {};
    }
  }

  private reconcileSchedules() {
    this.loadSchedulesFromDisk();
    // Optionally: query API for current schedules if an endpoint exists.
    // For now we rely on the event stream; local persisted schedules ensure
    // we won't lose upcoming actions across launcher restarts.

    // Re-schedule timers for local schedules
    Object.values(this.schedules).forEach((s) => {
      this.scheduleTimer(s);
    });
  }

  private onSchedule(payload: Schedule) {
    this.schedules[payload.id] = payload;
    this.saveSchedulesToDisk();
    this.scheduleTimer(payload);
  }

  private scheduleTimer(s: Schedule) {
    const now = Date.now();
    const when = new Date(s.scheduledAt).getTime();
    const delay = Math.max(0, when - now);

    setTimeout(async () => {
      if (s.action === "shutdown") {
        await this.stopGame(s.gameId);
      } else if (s.action === "restart") {
        await this.restartGame(s.gameId);
      }
      // mark executed locally (optionally notify API via endpoint)
      s.status = "executed";
      this.saveSchedulesToDisk();
    }, delay);
  }

  async startGame(gameId: string, execPath: string, args: string[] = []) {
    if (this.gameProcesses.has(gameId)) return;
    const proc = spawn(execPath, args, { detached: false });
    this.gameProcesses.set(gameId, proc);

    proc.on("exit", (code) => {
      console.log(`game ${gameId} exited ${code}`);
      this.gameProcesses.delete(gameId);
    });
  }

  async stopGame(gameId: string) {
    const proc = this.gameProcesses.get(gameId);
    if (!proc) return;
    proc.kill("SIGINT");
    // give it some time to exit
    await new Promise((res) => setTimeout(res, 2000));
    if (!proc.killed) proc.kill("SIGKILL");
    this.gameProcesses.delete(gameId);
  }

  async restartGame(gameId: string) {
    await this.stopGame(gameId);
    // You should have stored execPath/args mapping per game
    const execPath = this.resolveExecPathForGame(gameId);
    if (execPath) await this.startGame(gameId, execPath);
  }

  private resolveExecPathForGame(gameId: string): string | null {
    // Implement mapping from gameId -> executable path or launcher bundle
    return null;
  }
}

export default LauncherSocket;
```

Notes:

- Run these actions in a secure context. If the launcher accepts remote commands, validate the sender and require cryptographic authentication.
- Prefer graceful shutdown (SIGINT) before SIGKILL.

---

## Security & operational considerations

- Authentication: ensure launchers authenticate to the API before joining rooms. Use the same management tokens the launcher currently uses for other endpoints.
- Authorization: only allow a launcher to join rooms for games it is authorized to run.
- Reliability: persist schedules locally; do not rely exclusively on socket events.
- Time synchronization: schedules are ISO timestamps (UTC). Ensure launcher clock is reasonably accurate (NTP).
- Audit: the API should log who scheduled the action and when. The launcher may optionally report executed schedules back to the API.

---

## Developer checklist (for Launcher implementers)

- [ ] Add `socket.io-client` dependency and a background socket manager.
- [ ] On connect, emit `join-games` with the list of games the launcher manages.
- [ ] Persist incoming schedules locally and schedule timers.
- [ ] Implement graceful stop/start hooks for the game processes.
- [ ] Implement reconnection handling and re-join logic.
- [ ] Secure connections with TLS and proper tokens.

---

## FAQ

Q: "What happens if the launcher is offline at schedule time?"

A: The schedule remains in Redis. When the launcher reconnects it will receive the schedule event if the API re-emits, or it can reconcile using an API endpoint (if provided) to fetch pending schedules. Persisting schedules locally helps when the launcher restarts after receiving the event but before performing the action.

Q: "Can the API force immediate shutdown without scheduling?"

A: Yes — the `unavailable` event is intended for immediate closure requests.

---

For questions about this integration, contact the platform team or open an internal task referencing this document.
