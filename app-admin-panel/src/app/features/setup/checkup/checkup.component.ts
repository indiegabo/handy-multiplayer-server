import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { ConnectionStatusDto } from '@hms/shared-types/hms';
import { delay, finalize } from 'rxjs';
import { SetupService } from 'src/app/core/services/hms/setup.service';

export type ConnectionWrapper = ConnectionStatusDto & {
  display: string;
  loading: boolean;
};

@Component({
  selector: 'app-checkup',
  templateUrl: './checkup.component.html',
  styleUrls: ['./checkup.component.scss'],
  standalone: false,
})
export class CheckupComponent {
  loading = true;
  setupComplete = false;
  connections: ConnectionWrapper[] = [];
  allConnectionsValid = false;
  expandedError: string | null = null;
  checkingConnections = false;

  constructor(
    private setupService: SetupService,
    private router: Router,
  ) { }

  ngOnInit(): void {
    this.checkSetupStatus();
  }

  checkSetupStatus(): void {
    this.loading = true;
    this.setupService.status().pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (status) => {
        if (status.is_complete) {
          this.router.navigate(['/auth/login']);
        } else {
          this.setupComplete = false;
          this.initializeConnections();
        }
      },
      error: () => this.router.navigate(['/error'])
    });
  }

  initializeConnections(): void {
    this.connections = [
      { service: 'main-db', display: 'Main DB (PostgreSQL)', status: false, loading: true },
      { service: 'game-db', display: 'Games DB (MongoDB)', status: false, loading: true },
      { service: 'redis', display: 'Redis', status: false, loading: true },
      { service: 'smtp', display: 'E-mails (SMTP Connection)', status: false, loading: true }
    ];
    this.checkConnections();
  }

  checkConnections(): void {
    this.checkingConnections = true;
    this.setupService.checkAllConnections().pipe(
      finalize(() => this.checkingConnections = false)
    ).subscribe({
      next: (responses) => {
        this.connections = this.connections.map(conn => {
          const response = responses.find(r => r.service === conn.service);
          return {
            ...conn,
            ...response,
            loading: false
          };
        });
        this.allConnectionsValid = this.connections.every(c => c.status);
      },
      error: () => {
        this.connections = this.connections.map(conn => ({
          ...conn,
          loading: false,
          status: false,
          error: 'Failed to check connection'
        }));
      }
    });
  }

  toggleErrorDetails(service: string): void {
    this.expandedError = this.expandedError === service ? null : service;
  }

  navigateToSetup(): void {
    this.router.navigate(['/setup/process']);
  }

  trackByIndex(index: number, item: any): any {
    return index;
  }
}
