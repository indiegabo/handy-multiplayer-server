import { Component, OnDestroy, OnInit } from '@angular/core';
import { SystemStatus } from '@hms/shared-types';
import { Observable, BehaviorSubject, map, Subscription } from 'rxjs';
import {
  SystemService,
  SystemStatusEntry,
  StartMaintenancePayload,
} from 'src/app/core/services/hms/system.service';

/* ─────────────────────────────────────────────────────────────────────
 * View model
 * ──────────────────────────────────────────────────────────────────── */

/**
 * View model for the monitor component. Encapsulates the most useful
 * derived flags and CSS class mapping for the current status entry.
 */
type ViewModel = {
  entry: SystemStatusEntry;
  isUp: boolean;
  isPreparing: boolean;
  isUnder: boolean;
  isDegraded: boolean;
  badgeClass: string;
};

@Component({
  selector: 'app-monitor',
  templateUrl: './monitor.component.html',
  styleUrls: ['./monitor.component.scss'],
  standalone: false,
})
export class MonitorComponent implements OnInit, OnDestroy {
  /**
   * Stream of current status mapped into a UI-friendly structure.
   * Components bind to this observable for template rendering.
   */
  public vm$: Observable<ViewModel>;

  /** Loading flags per action to provide precise button feedback. */
  public startBusy$ = new BehaviorSubject<boolean>(false);
  public startPrepBusy$ = new BehaviorSubject<boolean>(false);
  public endBusy$ = new BehaviorSubject<boolean>(false);
  public cancelPrepBusy$ = new BehaviorSubject<boolean>(false);

  private subs: Subscription[] = [];

  constructor(private system: SystemService) {
    this.vm$ = this.system.systemStatus$.pipe(
      map((entry) => ({
        entry,
        isUp: entry.status === SystemStatus.Up,
        isPreparing: entry.status === SystemStatus.PreparingMaintenance,
        isUnder: entry.status === SystemStatus.UnderMaintenance,
        isDegraded: [
          SystemStatus.Down,
          SystemStatus.UnderMaintenance,
          SystemStatus.Unreachable,
          SystemStatus.Blocked,
        ].includes(entry.status),
        badgeClass: this.statusToBadgeClass(entry.status),
      })),
    );
  }

  /**
   * Subscribes to streams required at runtime. Currently, no explicit
   * side effects are required on init.
   */
  ngOnInit(): void {
    // Reserved for future telemetry or periodic refresh hooks.
  }

  /**
   * Disposes component resources and subscriptions.
   */
  ngOnDestroy(): void {
    this.subs.forEach((s) => s.unsubscribe());
  }

  /* ───────────────────────────────────────────────────────────────────
   * Actions
   * ───────────────────────────────────────────────────────────────── */

  /**
   * Starts a maintenance with no preparation time and a default
   * duration of 15 minutes (900 seconds).
   *
   * Errors propagate to the caller; UI can surface via global alerts.
   */
  async startMaintenanceNow(): Promise<void> {
    this.startBusy$.next(true);
    try {
      const payload: StartMaintenancePayload = {
        message: 'Immediate maintenance',
        preparation_duration_in_seconds: 0,
        maintenance_duration_in_seconds: 900,
      };
      await this.system.startMaintenance(payload);
    } finally {
      this.startBusy$.next(false);
    }
  }

  /**
   * Starts a maintenance with a short preparation phase. Default
   * duration remains 15 minutes, and preparation is 60 seconds.
   */
  async startMaintenanceWithPrep(): Promise<void> {
    this.startPrepBusy$.next(true);
    try {
      const payload: StartMaintenancePayload = {
        message: 'Scheduled maintenance',
        preparation_duration_in_seconds: 60,
        maintenance_duration_in_seconds: 900,
      };
      await this.system.startMaintenance(payload);
    } finally {
      this.startPrepBusy$.next(false);
    }
  }

  /**
   * Ends the current maintenance. Backend should drive the status
   * transition back to Up and notify via socket.
   */
  async endMaintenance(): Promise<void> {
    this.endBusy$.next(true);
    try {
      await this.system.endMaintenance();
    } finally {
      this.endBusy$.next(false);
    }
  }

  /**
   * Cancels the current preparation phase and returns to Up without
   * entering UnderMaintenance.
   */
  async cancelPreparation(): Promise<void> {
    this.cancelPrepBusy$.next(true);
    try {
      await this.system.cancelMaintenancePreparation();
    } finally {
      this.cancelPrepBusy$.next(false);
    }
  }

  /* ───────────────────────────────────────────────────────────────────
   * Helpers
   * ───────────────────────────────────────────────────────────────── */

  /**
   * Maps a SystemStatus to a CSS class used to render a badge style.
   */
  private statusToBadgeClass(status: SystemStatus): string {
    switch (status) {
      case SystemStatus.Up: return 'badge up';
      case SystemStatus.PreparingMaintenance: return 'badge preparing';
      case SystemStatus.UnderMaintenance: return 'badge maintenance';
      case SystemStatus.Down: return 'badge down';
      case SystemStatus.Unreachable: return 'badge unreachable';
      case SystemStatus.Blocked: return 'badge blocked';
      case SystemStatus.Unknown:
      default: return 'badge unknown';
    }
  }
}
