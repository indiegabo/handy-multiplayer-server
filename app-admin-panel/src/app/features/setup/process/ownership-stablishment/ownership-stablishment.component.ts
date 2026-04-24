import { Component, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminCreationPayload, AdminUserAuthInfoDto, Prepare2FAAccountCreationResponseDto } from '@hms/shared-types/hms';
import { delay, finalize, pipe, Subscription } from 'rxjs';
import { AlertsService } from 'src/app/core/services/alerts.service';
import { SetupService } from 'src/app/core/services/hms/setup.service';

@Component({
  selector: 'app-ownership-stablishment',
  standalone: false,
  templateUrl: './ownership-stablishment.component.html',
  styleUrls: ['./ownership-stablishment.component.scss']
})
export class OwnershipStablishmentComponent implements OnInit, OnDestroy {
  currentState: 'email-providing' | 'creating-owner' | 'done' = 'email-providing';

  checkingSetupStatus = true;
  checkingOwnerExistence = false;

  creating = false;

  existingOwner?: AdminUserAuthInfoDto;
  ownerCreationStartData?: Prepare2FAAccountCreationResponseDto;
  backupCodes?: string[];

  private subscriptions: Subscription[] = [];

  constructor(
    private setupService: SetupService,
    private router: Router,
    private alertsService: AlertsService,
  ) { }

  // Restante dos métodos permanece igual
  ngOnInit(): void {
    this.checkSetupStatus();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  onOwnerCreationDataReceived(data: Prepare2FAAccountCreationResponseDto): void {
    this.currentState = 'creating-owner';
    this.ownerCreationStartData = data;
  }

  onOwnerFormSubmitted(payload: AdminCreationPayload): void {
    this.creating = true;
    const sub = this.setupService.createOwner(payload)
      .pipe(finalize(() => this.creating = false))
      .subscribe({
        next: (response) => {
          this.existingOwner = response.admin;
          this.backupCodes = response.backup_codes;
          this.currentState = 'done';
        },
        error: (error) => {
          this.alertsService.alertErrorResponse(error);
        }
      });
    this.subscriptions.push(sub);
  }

  navigateToLogin(): void {
    this.router.navigate(['/auth/login']);
  }

  downloadBackupCodes(): void {
    if (!this.backupCodes || this.backupCodes.length === 0) {
      this.alertsService.alert('No backup codes available to download');
      return;
    }

    try {
      // Add header and instructions to the file
      const header = `=== BACKUP CODES ===\n\n` +
        `These codes can be used to access your account if you lose your authenticator device.\n` +
        `Each code can only be used once.\n\n` +
        `Store them in a secure place!\n\n`;

      const content = header + this.backupCodes.join('\n');

      // Create blob with UTF-8 encoding
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backup_codes.txt';
      a.style.display = 'none';

      // Trigger download
      document.body.appendChild(a);
      a.click();

      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      this.alertsService.alert('Backup codes downloaded successfully');
    } catch (error) {
      this.alertsService.error('Failed to download backup codes');
      console.error('Error downloading backup codes:', error);
    }
  }

  private checkSetupStatus(): void {
    this.checkingSetupStatus = true;
    const sub = this.setupService.status()
      .pipe(
        finalize(() => this.checkingSetupStatus = false)
      )
      .subscribe({
        next: (status) => {
          if (status.is_complete) {
            this.router.navigate(['/app']);
          } else {
            this.checkOwner();
          }
        },
        error: (errorRes) => this.alertsService.alertErrorResponse(errorRes)
      });
    this.subscriptions.push(sub);
  }

  private checkOwner(): void {
    this.checkingOwnerExistence = true;
    const sub = this.setupService.checkOwnerExists().pipe(
      finalize(() => this.checkingOwnerExistence = false)
    ).subscribe({
      next: (ownerCheckup) => {
        this.existingOwner = ownerCheckup.owner;
        if (this.existingOwner) {
          this.router.navigate(['/app']);
        }
      },
      error: (errorResponse) => this.alertsService.alertErrorResponse(errorResponse)
    });
    this.subscriptions.push(sub);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
