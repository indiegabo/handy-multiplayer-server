import { Injectable, Injector } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AlertsService } from '../services/alerts.service';
import { AuthService } from '../services/hms/auth.service';
import { SUPPRESS_ERROR_ALERT } from './http-context-tokens';

/**
 * ErrorInterceptor
 *  - Handles HTTP errors globally.
 *  - On 401, triggers logout and redirect to login.
 *  - Displays error alerts for non-401 errors.
 */
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private injector: Injector,
  ) { }

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler,
  ): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((err: HttpErrorResponse) => {
        return this.handleError(err, req);
      }),
    );
  }

  /**
   * Handles HTTP errors.
   * @param responseError - The HTTP error response.
   * @returns An observable that throws the error.
   */
  private handleError(
    responseError: HttpErrorResponse,
    request: HttpRequest<any>,
  ): Observable<never> {
    const alertService = this.injector.get(AlertsService);
    const authService = this.injector.get(AuthService);
    const suppressAutoAlert = request.context.get(SUPPRESS_ERROR_ALERT);

    if (suppressAutoAlert) {
      return throwError(() => responseError);
    }

    // Handle 401 Unauthorized errors
    if (responseError.status === 401) {
      // Notify user about forced logout
      alertService.warning('Your session has expired. Please login again.');

      // Clear auth state and redirect to login
      authService.logout().subscribe(() => {
        this.router.navigate(['/auth/login'], {
          queryParams: { returnUrl: this.router.url },
          replaceUrl: true,
        });
      });
    } else if (responseError.error?.message) {
      // Display error message for other errors
      alertService.error(responseError.error.message);
    } else if (responseError.error?.messages) {
      // Handle multiple error messages
      responseError.error.messages.forEach((msg: string) => {
        alertService.error(msg);
      });
    } else {
      // Generic error message
      alertService.error('An unexpected error occurred');
    }

    return throwError(() => responseError);
  }
}
