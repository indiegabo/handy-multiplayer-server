import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { TranslateService } from '@ngx-translate/core';
import { ErrorResponse } from 'src/app/shared/models/http/http-responses';

export const DEFAULT_ALERT_DURATION = 5;

export interface AlertConfig {
  duration?: number;
  action?: string;
  horizontalPosition?: 'start' | 'center' | 'end' | 'left' | 'right';
}

const DEFAULT_GENERIC_ERROR = 'Operation Error';

@Injectable({
  providedIn: 'root'
})
export class AlertsService {

  constructor(
    private _snackBar: MatSnackBar,
    private _translateService: TranslateService
  ) { }

  /**
   * Shows a generic alert.
   */
  public alert(message: string, config?: AlertConfig): void {
    const msDuration = (config && config.duration)
      ? config.duration * 1000
      : DEFAULT_ALERT_DURATION * 1000;

    const translatedMessage = this._translateService.instant(message);

    this._snackBar.open(
      translatedMessage,
      (config && config.action) ? config.action : '',
      {
        duration: msDuration,
        panelClass: 'handy-snackbar',
        horizontalPosition: (config && config.horizontalPosition)
          ? config.horizontalPosition
          : 'right',
      },
    );
  }

  /**
   * Shows a success alert.
   */
  public success(message: string, config?: AlertConfig): void {
    const msDuration = (config && config.duration)
      ? config.duration * 1000
      : DEFAULT_ALERT_DURATION * 1000;

    const translatedMessage = this._translateService.instant(message);

    this._snackBar.open(
      translatedMessage,
      (config && config.action) ? config.action : '',
      {
        duration: msDuration,
        panelClass: 'handy-success-snackbar',
        horizontalPosition: (config && config.horizontalPosition)
          ? config.horizontalPosition
          : 'right',
      },
    );
  }

  /**
   * Shows a warning alert.
   */
  public warning(message: string, config?: AlertConfig): void {
    if (!message) return;

    const msDuration = (config && config.duration)
      ? config.duration * 1000
      : DEFAULT_ALERT_DURATION * 1000;

    const translatedMessage = this._translateService.instant(message);

    this._snackBar.open(
      translatedMessage,
      (config && config.action) ? config.action : '',
      {
        duration: msDuration,
        panelClass: 'handy-warning-snackbar',
        horizontalPosition: (config && config.horizontalPosition)
          ? config.horizontalPosition
          : 'right',
      },
    );
  }

  /**
   * Shows an error alert.
   */
  public error(message: string, config?: AlertConfig): void {
    if (!message) return;

    const msDuration = (config && config.duration)
      ? config.duration * 1000
      : DEFAULT_ALERT_DURATION * 1000;

    const translatedMessage = this._translateService.instant(message);

    this._snackBar.open(
      translatedMessage,
      (config && config.action) ? config.action : '',
      {
        duration: msDuration,
        panelClass: 'handy-error-snackbar',
        horizontalPosition: (config && config.horizontalPosition)
          ? config.horizontalPosition
          : 'right',
      },
    );
  }

  /**
   * Examines an error payload and shows a composed error alert.
   * - If matches API shape: { status_code: number, messages: string[] },
   *   show a single alert listing all messages.
   * - Otherwise, show a generic "Operation Error".
   */
  public alertErrorResponse(errorRes: unknown | ErrorResponse, config?: AlertConfig): void {
    console.error(errorRes);
    // If the caller passed an ErrorResponse directly, handle it first.
    if (this.isErrorResponse(errorRes)) {
      const msgs = (errorRes.messages || [])
        .filter((m) => typeof m === 'string' && m.trim())
        .map((m) => m.trim());

      if (msgs.length) {
        this.error(msgs.join(' • '), config);
        return;
      }
    }

    // Fallback: try to extract messages from other shapes (HttpErrorResponse, etc.)
    const message = this.extractApiErrorMessages(errorRes);

    if (message) {
      this.error(message, config);
    } else {
      this.error(DEFAULT_GENERIC_ERROR, config);
    }
  }

  /**
   * Narrowing helper to detect server `ErrorResponse` shape.
   */
  private isErrorResponse(obj: unknown): obj is ErrorResponse {
    return (
      !!obj &&
      typeof obj === 'object' &&
      typeof (obj as any).status_code === 'number' &&
      Array.isArray((obj as any).messages)
    );
  }

  // #region Helpers

  /**
   * Tries to extract API error messages from various shapes, primarily:
   * { status_code: number, messages: string[] }
   * Returns a single string with all messages joined, or null if not found.
   */
  private extractApiErrorMessages(err: unknown): string | null {
    const lines: string[] = [];
    const pushAll = (val: unknown) => {
      if (Array.isArray(val)) {
        for (const item of val) {
          if (typeof item === 'string' && item.trim()) {
            lines.push(item.trim());
          }
        }
      } else if (typeof val === 'string' && val.trim()) {
        lines.push(val.trim());
      }
    };

    // Angular HttpErrorResponse puts the server body into `error`
    const anyErr: any = err as any;
    const body = (anyErr && anyErr.error) ? anyErr.error : anyErr;

    // Primary: our API shape
    if (
      body &&
      typeof body === 'object' &&
      typeof (body as any).status_code === 'number' &&
      Array.isArray((body as any).messages)
    ) {
      pushAll((body as any).messages);
      return lines.length ? lines.join(' • ') : null;
    }

    // Fallbacks: try common fields if needed (optional)
    pushAll(anyErr?.message);
    pushAll(body?.message);
    pushAll(body?.messages); // could be string[] or string

    return lines.length ? lines.join(' • ') : null;
  }

  // #endregion
}
