import {
  Component,
  OnDestroy,
  OnInit,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
} from '@angular/router';
import { AdminCreationPayload, Prepare2FAAccountCreationResponseDto } from '@hms/shared-types';
import {
  Subscription,
  finalize,
} from 'rxjs';
import { AlertsService } from 'src/app/core/services/alerts.service';
import { AuthService } from 'src/app/core/services/hms/auth.service';

/**
 * Create Admin Account component.
 *
 * Reads the token from either query param (?token=) or route param (:token).
 * Starts the admin creation flow and shows the admin form upon success.
 */
@Component({
  selector: 'app-create-admin-account',
  standalone: false,
  templateUrl: './create-admin-account.component.html',
  styleUrls: ['./create-admin-account.component.scss'],
})
export class CreateAdminAccountComponent implements OnInit, OnDestroy {
  currentState:
    | 'initializing'
    | 'preparing'
    | 'creating'
    | 'done' = 'initializing';

  loadingStart = false;
  creating = false;

  inviteToken?: string;
  startData?: Prepare2FAAccountCreationResponseDto;
  backupCodes?: string[];

  private subs: Subscription[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private alerts: AlertsService,
    private authService: AuthService,
  ) { }

  /**
   * Subscribes to query/route params to support both patterns:
   * - /auth/create-admin-account?token=XYZ
   * - /auth/create-admin-account/XYZ
   *
   * Using a subscription handles the case where the same component instance
   * stays alive while query params change.
   */
  ngOnInit(): void {
    const sub = this.route.queryParamMap.subscribe(() => {
      const token = this.readTokenFromRoute();
      if (!token) {
        this.router.navigate(['/errors/not-found'], {
          replaceUrl: true,
        });
        return;
      }

      this.inviteToken = token;
      this.currentState = 'preparing';
      this.callStartAdminAccountCreation(token);
    });

    this.subs.push(sub);
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  /**
   * Try to read from query param first, then route param.
   * Also walks up the parent chain to be robust with nested routes.
   */
  private readTokenFromRoute(): string | null {
    // Try current route first.
    const qp = this.route.snapshot.queryParamMap.get('token');
    const rp = this.route.snapshot.paramMap.get('token');
    if (qp) return qp;
    if (rp) return rp;

    // Walk parents if this component is nested.
    let parent = this.route.parent;
    while (parent) {
      const pqp = parent.snapshot.queryParamMap.get('token');
      const prp = parent.snapshot.paramMap.get('token');
      if (pqp) return pqp;
      if (prp) return prp;
      parent = parent.parent;
    }

    // Last resort: check router root.
    const rootQP =
      this.router.routerState.root.snapshot.queryParamMap.get('token');
    const rootRP =
      this.router.routerState.root.snapshot.paramMap.get('token');

    return rootQP ?? rootRP ?? null;
  }

  private callStartAdminAccountCreation(token: string): void {
    this.loadingStart = true;

    const sub = this.authService
      .startAdminAccountCreation(token)
      .pipe(finalize(() => (this.loadingStart = false)))
      .subscribe({
        next: (data) => {
          this.startData = data;
          this.currentState = 'creating';
        },
        error: (error) => {
          this.alerts.alertErrorResponse(error);
          this.router.navigate(['/errors/not-found'], {
            replaceUrl: true,
          });
        },
      });

    this.subs.push(sub);
  }

  onAdminFormSubmitted(data: AdminCreationPayload): void {
    this.creating = true;

    if (!this.inviteToken) {
      return;
    }

    const sub = this.authService
      .createAdminAccountFromInvite(this.inviteToken, data)
      .pipe(finalize(() => (this.creating = false)))
      .subscribe({
        next: (data) => {
          this.backupCodes = data.backup_codes;
          this.currentState = 'done';
          this.alerts.alert('Admin account created successfully');
        },
        error: (error) => {
          this.alerts.alertErrorResponse(error);
        },
      });

    this.subs.push(sub);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  downloadBackupCodes(): void {
    if (!this.backupCodes || this.backupCodes.length === 0) {
      this.alerts.alert('No backup codes available to download');
      return;
    }

    try {
      const header =
        '=== BACKUP CODES ===\n\n' +
        'Use these codes if you lose your authenticator.\n' +
        'Each code can be used only once.\n\n' +
        'Store them in a secure place!\n\n';

      const content = header + this.backupCodes.join('\n');
      const blob = new Blob([content], {
        type: 'text/plain;charset=utf-8',
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');

      a.href = url;
      a.download = 'backup_codes.txt';
      a.style.display = 'none';

      document.body.appendChild(a);
      a.click();

      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.alerts.alert('Backup codes downloaded successfully');
    } catch (error) {
      this.alerts.error('Failed to download backup codes');
      // eslint-disable-next-line no-console
      console.error('Error downloading backup codes:', error);
    }
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
