import { Clipboard } from '@angular/cdk/clipboard';
import { Injectable } from '@angular/core';
import { AlertsService } from './alerts.service';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  constructor(
    private alertsService: AlertsService,
    private clipboard: Clipboard,
  ) { }

  public copy(text: string, alert = true): void {
    this.clipboard.copy(text);
    if (alert) {
      this.alertsService.alert(`${text} copied to clipboard`, { duration: 2 });
    }
  }
}
