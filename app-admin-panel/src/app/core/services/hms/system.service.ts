import { Injectable, NgZone, OnDestroy } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  Subscription,
  map,
  firstValueFrom,
} from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from 'src/environments/environment';
import { RequestMeta }
  from 'src/app/shared/models/http/http-request';
import { ApiResponse } from '@hms/shared-types/hms';
import { HttpService } from '../http.service';

/* ─────────────────────────────────────────────────────────────────────
 * Status model
 * ──────────────────────────────────────────────────────────────────── */

/**
 * System lifecycle states mirrored from the backend.
 * Values above 700M are client-only sentinel states.
 */
export enum SystemStatus {
  Up = 1,
  Down = 2,
  PreparingMaintenance = 3,
  UnderMaintenance = 4,
  Unreachable = 753159751,
  Unknown = 753159752,
  Blocked = 753159753,
}

/**
 * Human-readable status entry published to consumers.
 */
export type SystemStatusEntry = {
  status: SystemStatus;
  readableStatus: string;
};

/**
 * Realtime notification payload received via socket.
 */
export type SystemStatusNotificationData = {
  status: SystemStatus;
  message?: string;
  maintenance_duration_in_seconds?: number;
  preparation_time_in_seconds?: number;
};

type StatusResponse = { status: SystemStatus };

/**
 * Payload used to start a maintenance window.
 * Mirrors backend DTO fields.
 */
export type StartMaintenancePayload = {
  message?: string;
  maintenance_duration_in_seconds?: number;
  preparation_duration_in_seconds?: number;
};

/* ─────────────────────────────────────────────────────────────────────
 * SystemService
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Provides system status observation and maintenance control.
 * - Probes current status via HTTP at startup.
 * - Subscribes to socket 'status' for realtime transitions.
 * - Exposes maintenance commands via HTTP endpoints.
 */
@Injectable({ providedIn: 'root' })
export class SystemService implements OnDestroy {
  /** Internal state stream with last known status. */
  private readonly _systemStatus$ =
    new BehaviorSubject<SystemStatusEntry>({
      status: SystemStatus.Unknown,
      readableStatus: this.generateReadableStatus(
        SystemStatus.Unknown,
      ),
    });

  /**
   * Public observable with debuggable, human-readable status.
   * @returns Observable stream of SystemStatusEntry.
   */
  get systemStatus$(): Observable<SystemStatusEntry> {
    return this._systemStatus$.asObservable();
  }

  /**
   * Synchronous snapshot of the latest status entry.
   * @returns Last emitted SystemStatusEntry.
   */
  get systemStatus(): SystemStatusEntry {
    return this._systemStatus$.value;
  }

  private systemSocket: Socket;
  private evaluateStatusSubscription?: Subscription;

  /** Statuses considered degraded for logging purposes. */
  private readonly downStatuses: SystemStatus[] = [
    SystemStatus.Down,
    SystemStatus.UnderMaintenance,
    SystemStatus.Unreachable,
    SystemStatus.Blocked,
  ];

  /**
   * Sets up socket connection and performs initial status probe.
   */
  constructor(
    private httpService: HttpService,
    private ngZone: NgZone,
  ) {
    const socketUrl = this.resolveSocketServerUrl(
      environment.system.baseUrl,
    );

    this.systemSocket = io(socketUrl, {
      autoConnect: true,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    // Realtime server push for status changes.
    this.systemSocket.on(
      'status',
      (data: SystemStatusNotificationData) => {
        this.ngZone.run(() => {
          this.setSystemStatus(data.status);
        });
      },
    );

    this.systemSocket.on('connect_error', (error: Error) => {
      console.error(
        '[SystemService] Socket connection error:',
        error?.message ?? error,
      );
    });

    this.systemSocket.on('disconnect', (reason) => {
      console.warn(
        `[SystemService] Socket disconnected: ${reason}`,
      );
    });

    // Initial HTTP probe for current state.
    this.evaluateStatus();
  }

  /**
   * Resolves the Socket.IO server URL from an HTTP API base URL.
   * Example: https://system.example.com/v1 -> https://system.example.com
   */
  private resolveSocketServerUrl(baseUrl: string): string {
    try {
      return new URL(baseUrl).origin;
    } catch {
      return new URL(baseUrl, window.location.origin).origin;
    }
  }

  /**
   * Unsubscribes HTTP polling and closes socket connection.
   */
  ngOnDestroy(): void {
    this.evaluateStatusSubscription?.unsubscribe();
    this.systemSocket?.disconnect();
  }

  /* ───────────────────────────────────────────────────────────────────
   * Maintenance control (HTTP)
   * ───────────────────────────────────────────────────────────────── */

  /**
   * Requests the backend to start maintenance.
   * Backend may transition: Up → PreparingMaintenance → UnderMaintenance.
   * Status updates are expected via socket 'status'.
   *
   * @param payload StartMaintenancePayload with optional message,
   *                preparation and duration (seconds).
   * @returns Promise<boolean> indicating backend acceptance.
   */
  async startMaintenance(
    payload: StartMaintenancePayload,
  ): Promise<boolean> {
    const url =
      `${environment.system.baseUrl}/system/start-maintenance`;

    // Compose meta according to HttpService contract:
    // POST body must be provided via meta.body.
    const meta: RequestMeta = { body: payload };

    try {
      const resp = await firstValueFrom(
        this.httpService.post<ApiResponse<boolean>>(url, meta),
      );
      return !!resp?.data;
    } catch (error) {
      console.error(
        '[SystemService] Failed to start maintenance:',
        error,
      );
      throw error;
    }
  }

  /**
   * Requests the backend to end an ongoing maintenance.
   * Backend should transition: UnderMaintenance → Up.
   * Status updates are expected via socket 'status'.
   *
   * @returns Promise<boolean> indicating backend acceptance.
   */
  async endMaintenance(): Promise<boolean> {
    const url =
      `${environment.system.baseUrl}/system/end-maintenance`;

    // Some backends require an explicit empty object.
    const meta: RequestMeta = { body: {} };

    try {
      const resp = await firstValueFrom(
        this.httpService.post<ApiResponse<boolean>>(url, meta),
      );
      return !!resp?.data;
    } catch (error) {
      console.error(
        '[SystemService] Failed to end maintenance:',
        error,
      );
      throw error;
    }
  }

  /**
   * Requests the backend to cancel a scheduled preparation phase.
   * Backend should transition: PreparingMaintenance → Up.
   * Status updates are expected via socket 'status'.
   *
   * @returns Promise<boolean> indicating backend acceptance.
   */
  async cancelMaintenancePreparation(): Promise<boolean> {
    const url =
      `${environment.system.baseUrl}` +
      `/system/cancel-maintenance-preparation`;

    const meta: RequestMeta = { body: {} };

    try {
      const resp = await firstValueFrom(
        this.httpService.post<ApiResponse<boolean>>(url, meta),
      );
      return !!resp?.data;
    } catch (error) {
      console.error(
        '[SystemService] Failed to cancel maintenance preparation:',
        error,
      );
      throw error;
    }
  }

  /* ───────────────────────────────────────────────────────────────────
   * Status probing (HTTP + Socket)
   * ───────────────────────────────────────────────────────────────── */

  /**
   * Performs a one-shot status probe via HTTP and updates stream.
   */
  private evaluateStatus(): void {
    this.evaluateStatusSubscription?.unsubscribe();

    const meta: RequestMeta = {};
    this.evaluateStatusSubscription =
      this.httpService
        .get<ApiResponse<StatusResponse>>(
          `${environment.system.baseUrl}/system/status`,
          meta,
        )
        .pipe(
          map((responseBody) => {
            if (!responseBody || !responseBody.data) {
              throw new Error('No data in response');
            }
            return responseBody.data.status;
          }),
        )
        .subscribe({
          next: (status) => this.setSystemStatus(status),
          error: () => this.setSystemStatus(
            SystemStatus.Unreachable,
          ),
        });
  }

  /**
   * Publishes a new status entry and emits diagnostic logs
   * for degraded states.
   *
   * @param status New SystemStatus from server.
   */
  private setSystemStatus(status: SystemStatus): void {
    const entry: SystemStatusEntry = {
      status,
      readableStatus: this.generateReadableStatus(status),
    };

    this._systemStatus$.next(entry);

    if (status === SystemStatus.Up) {
      if (!this.systemSocket.connected) {
        this.systemSocket.connect();
      }
      return;
    }

    if (this.downStatuses.includes(status)) {
      const isHardDown = [
        SystemStatus.Down,
        SystemStatus.Blocked,
      ].includes(status);

      const logMsg =
        `[SystemService] System status changed: ` +
        `${entry.readableStatus} (${status}).`;

      if (isHardDown) console.error(logMsg);
      else console.warn(logMsg);
    }
  }

  /**
   * Maps enum statuses to localized, human-readable labels.
   *
   * @param status SystemStatus to translate.
   * @returns Readable label for UI.
   */
  private generateReadableStatus(status: SystemStatus): string {
    switch (status) {
      case SystemStatus.Up: return 'Up';
      case SystemStatus.Down: return 'Down';
      case SystemStatus.PreparingMaintenance:
        return 'Preparing Maintenance';
      case SystemStatus.UnderMaintenance:
        return 'Under Maintenance';
      case SystemStatus.Unreachable: return 'Unreachable';
      case SystemStatus.Unknown: return 'Unknown';
      case SystemStatus.Blocked: return 'Blocked';
      default: return 'Unknown';
    }
  }
}
