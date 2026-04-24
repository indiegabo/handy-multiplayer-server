import { HttpContextToken } from '@angular/common/http';

/**
 * Controls whether ErrorInterceptor should suppress automatic user alerts
 * for a specific HTTP request.
 */
export const SUPPRESS_ERROR_ALERT = new HttpContextToken<boolean>(
    () => false,
);
