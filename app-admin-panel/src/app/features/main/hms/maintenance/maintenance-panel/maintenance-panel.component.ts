import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { environment } from 'src/environments/environment';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import {
  BehaviorSubject,
  Subject,
  combineLatest,
  map,
  takeUntil,
} from 'rxjs';
import { SystemStatus } from '@hms/shared-types';
import {
  SystemService,
  StartMaintenancePayload,
} from 'src/app/core/services/hms/system.service';

/* ─────────────────────────────────────────────────────────────────────
 * Typed FormGroup
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Strongly-typed reactive form structure for this component.
 * Values are minutes; conversion to seconds is applied on submit.
 */
type MaintenanceFormGroup = {
  delayMinutes: FormControl<number>;
  durationMinutes: FormControl<number>;
};

/* ─────────────────────────────────────────────────────────────────────
 * ViewState
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Computed capabilities from current system state. The form is disabled
 * while a maintenance flow is in progress or the system is blocked.
 */
type MaintenanceViewState = {
  status: SystemStatus;
  canSchedule: boolean;
  canCancelPreparing: boolean;
  canEndMaintenance: boolean;
  formDisabled: boolean;
};

/* ─────────────────────────────────────────────────────────────────────
 * MaintenancePanelComponent
 * ──────────────────────────────────────────────────────────────────── */

/**
 * Presents a maintenance control panel:
 *  - Schedules maintenance (delay + duration, in minutes).
 *  - Reacts to live status from SystemService.systemStatus$.
 *  - Disables form while preparing/under maintenance/blocked.
 *
 * UI constraints:
 *  - Only 'border-radius-5' for rounded corners.
 *  - Spacing must be in 0.5em steps.
 *  - No direct backgrounds; use bg-* utility classes.
 */
@Component({
  selector: 'sg-maintenance-panel',
  templateUrl: './maintenance-panel.component.html',
  styleUrls: ['./maintenance-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MaintenancePanelComponent implements OnInit, OnDestroy {
  /* ───────────────────────────────────────────────────────────────────
   * Reactive form (strongly-typed)
   * ───────────────────────────────────────────────────────────────── */
  public readonly form: FormGroup<MaintenanceFormGroup> =
    new FormGroup<MaintenanceFormGroup>({
      delayMinutes: new FormControl<number>(1, {
        nonNullable: true,
        validators: [Validators.min(1)],
      }),
      durationMinutes: new FormControl<number>(30, {
        nonNullable: true,
        validators: [Validators.min(1)],
      }),
    });

  /** Convenience getters for template readability. */
  get delay(): FormControl<number> { return this.form.controls.delayMinutes; }
  get duration(): FormControl<number> {
    return this.form.controls.durationMinutes;
  }

  /* ───────────────────────────────────────────────────────────────────
   * Loading states
   * ───────────────────────────────────────────────────────────────── */
  /**
   * Global submitting for schedule and cancel-preparing actions.
   * End-maintenance uses a dedicated state to match UX requirements.
   */
  private readonly submittingS = new BehaviorSubject<boolean>(false);
  public readonly submitting$ = this.submittingS.asObservable();

  /**
   * Dedicated loading for "End maintenance" that only stops on failure.
   */
  private readonly endingS = new BehaviorSubject<boolean>(false);
  public readonly ending$ = this.endingS.asObservable();

  /**
   * Local, optimistic suppression of the scheduling block right after a
   * successful "startMaintenance" request, preventing flicker while the
   * socket pushes the status change to PreparingMaintenance.
   */
  private readonly schedulingSuppressedS =
    new BehaviorSubject<boolean>(false);

  /* ───────────────────────────────────────────────────────────────────
   * View model
   * ───────────────────────────────────────────────────────────────── */
  public readonly viewState$ = combineLatest([
    this.system.systemStatus$,     // { status, readableStatus }
  ]).pipe(
    map(([entry]): MaintenanceViewState => {
      const status = entry.status;
      const canSchedule = status === SystemStatus.Up;
      const canCancelPreparing =
        status === SystemStatus.PreparingMaintenance;
      const canEndMaintenance =
        status === SystemStatus.UnderMaintenance;

      const formDisabled =
        status === SystemStatus.PreparingMaintenance ||
        status === SystemStatus.UnderMaintenance ||
        status === SystemStatus.Blocked;

      return {
        status,
        canSchedule,
        canCancelPreparing,
        canEndMaintenance,
        formDisabled,
      };
    })
  );

  /** Human-readable label for the badge. */
  public readonly readableStatus$ = this.system.systemStatus$.pipe(
    map((entry) => entry.readableStatus)
  );

  /** CSS class for the badge background (uses bg-* utilities). */
  public readonly statusClass$ = this.system.systemStatus$.pipe(
    map((entry) => {
      switch (entry.status) {
        case SystemStatus.PreparingMaintenance:
          return 'status-preparing bg-15';
        case SystemStatus.UnderMaintenance:
          return 'status-maintenance bg-20';
        case SystemStatus.Down:
          return 'status-down bg-10';
        case SystemStatus.Unreachable:
          return 'status-unreachable bg-10';
        case SystemStatus.Blocked:
          return 'status-blocked bg-10';
        case SystemStatus.Unknown:
          return 'status-unknown bg-10';
        case SystemStatus.Up:
        default:
          return 'status-up bg-5';
      }
    })
  );

  /**
   * Scheduling visibility:
   *  - Visible only when status === Up AND not optimistically suppressed.
   *  - Suppression is cleared as soon as the status leaves Up, so the
   *    next time it returns to Up the scheduling reappears.
   */
  public readonly canShowScheduling$ = combineLatest([
    this.system.systemStatus$,
    this.schedulingSuppressedS,
  ]).pipe(
    map(([entry, suppressed]) =>
      entry.status === SystemStatus.Up && !suppressed
    )
  );

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly system: SystemService,
  ) { }

  /** True when running in development environment. Controls dev-only UI. */
  public readonly isDev = !environment.production;

  ngOnInit(): void {
    this.system.systemStatus$
      .pipe(takeUntil(this.destroy$))
      .subscribe((entry) => {
        const s = entry.status;

        // Disable form on server-driven states.
        const disable =
          s === SystemStatus.PreparingMaintenance ||
          s === SystemStatus.UnderMaintenance ||
          s === SystemStatus.Blocked;
        this.toggleForm(disable);

        // Clear optimistic suppression once status leaves Up.
        if (s !== SystemStatus.Up) {
          this.schedulingSuppressedS.next(false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Schedules a maintenance window using delay and duration inputs.
   * Converts minutes → seconds for the backend DTO.
   *
   * Optimistic UX:
   *  - Immediately suppress the scheduling block to avoid flicker while
   *    waiting for the socket to update status to PreparingMaintenance.
   *  - If the call fails, re-enable the scheduling block.
   */
  public async onSchedule(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const delayMin = this.delay.value ?? 0;
    const durationMin = this.duration.value ?? 0;

    const payload: StartMaintenancePayload = {
      preparation_duration_in_seconds: Math.max(
        0, Math.floor(delayMin * 60)
      ),
      maintenance_duration_in_seconds: Math.max(
        60, Math.floor(durationMin * 60)
      ),
    };

    if (this.submittingS.value) return;
    this.submittingS.next(true);
    this.schedulingSuppressedS.next(true);
    try {
      await this.system.startMaintenance(payload);
      // Success path:
      // - Keep scheduling suppressed until status leaves Up
      //   (handled by status subscription).
    } catch (err) {
      // Failure: restore scheduling visibility.
      this.schedulingSuppressedS.next(false);
      throw err;
    } finally {
      this.submittingS.next(false);
    }
  }

  /**
   * Cancels an ongoing preparation before the maintenance starts.
   */
  public async onCancelPreparing(): Promise<void> {
    await this.runSubmitting(async () => {
      await this.system.cancelMaintenancePreparation();
    });
  }

  /**
   * Ends an active maintenance immediately.
   *
   * UX rule:
   *  - Set dedicated loading that only stops on failure.
   *  - On success, the button disappears because status changes.
   */
  public async onEndMaintenance(): Promise<void> {
    if (this.endingS.value) return;
    this.endingS.next(true);
    try {
      await this.system.endMaintenance();
      // Do not clear endingS on success. Button will be removed
      // by view rules when status changes.
    } catch (err) {
      // Failure: allow user to try again.
      this.endingS.next(false);
      throw err;
    }
  }

  /**
   * Executes an async action under a single-flight guard and exposes
   * loading state to the template.
   *
   * @param action Async lambda to execute within loading guard.
   */
  private async runSubmitting(action: () => Promise<void>): Promise<void> {
    if (this.submittingS.value) return;
    this.submittingS.next(true);
    try {
      await action();
    } finally {
      this.submittingS.next(false);
    }
  }

  /**
   * Dev helper: start maintenance with minimal preparation (1s).
   * Visible only when `isDev` is true.
   */
  public async startMaintenanceDev(): Promise<void> {
    if (!this.isDev) return;

    const payload: StartMaintenancePayload = {
      preparation_duration_in_seconds: 1,
      maintenance_duration_in_seconds: 60,
    };

    await this.runSubmitting(async () => {
      await this.system.startMaintenance(payload);
    });
  }

  /**
   * Toggles the form disabled/enabled state and mirrors to observable
   * for consistent UI reflection.
   */
  private toggleForm(disabled: boolean): void {
    if (disabled) this.form.disable({ emitEvent: false });
    else this.form.enable({ emitEvent: false });
  }
}
