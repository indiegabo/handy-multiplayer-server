/* eslint-disable @typescript-eslint/no-base-to-string */
import { LanguagesService } from './languages.service';
import { Observable, catchError, map, tap } from 'rxjs';
import {
  HttpClient,
  HttpContext,
  HttpHeaders,
  HttpParams,
  HttpResponse,
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AlertsService } from './alerts.service';
import { RequestMeta } from 'src/app/shared/models/http/http-request';
import { ErrorResponse } from 'src/app/shared/models/http/http-responses';
import { SUPPRESS_ERROR_ALERT } from '../interceptors/http-context-tokens';

@Injectable({
  providedIn: 'root'
})
export class HttpService {

  constructor(
    private http: HttpClient,
    private alertsService: AlertsService,
    private languagesService: LanguagesService
  ) {
  }

  /**
   * Performs a GET request to the specified URL with optional request metadata.
   * @param url - The URL to send the GET request to.
   * @param meta - Optional metadata for the request.
   * @returns An Observable that emits the response from the GET request.
   */
  public get<T>(url: string, meta?: RequestMeta): Observable<T> {
    // Generate the headers based on the authentication method
    const headers = this.createHeaders(meta);
    const context = this.createContext(meta);

    // Create the query parameters for the request
    let params = new HttpParams;
    params = this.addPaginationParams(params, meta);
    params = this.addMetaParams(params, meta);

    // Send the GET request with the specified URL, headers, and parameters
    return this.http.get<T>(url, { headers, params, context })
      .pipe(
        catchError((error: ErrorResponse) => {
          throw error;
        })
      );
  }

  public getBlob(url: string, meta?: RequestMeta): Observable<Blob> {
    // Generate the headers based on the authentication method
    const headers = this.createHeaders(meta);
    const context = this.createContext(meta);

    // Create the query parameters for the request
    let params = new HttpParams;
    params = this.addPaginationParams(params, meta);
    params = this.addMetaParams(params, meta);

    // Send the GET request with the specified URL, headers, and parameters
    return this.http.get(url, {
      headers,
      params,
      responseType: 'blob',
      context,
    }).pipe(
      catchError((error: ErrorResponse) => {
        throw error;
      })
    );
  }


  /**
   * Send a POST request to the specified URL with the given metadata.
   *
   * @param url - The URL to send the request to.
   * @param meta - The metadata for the request.
   * @returns An Observable that emits the response of the request.
   */
  public post<T>(url: string, meta?: RequestMeta): Observable<T> {
    // Generate the headers for the request
    const headers = this.createHeaders(meta);
    const context = this.createContext(meta);

    // Create the query parameters for the request
    let params = new HttpParams;
    params = this.addMetaParams(params, meta);

    // Send the POST request with the specified URL, data, and headers
    return this.http.post<T>(url, meta?.body, { headers, params, context }).pipe(
      catchError((error: ErrorResponse) => {
        throw error;
      })
    );
  }

  /**
   * Sends a PUT request to the specified URL with optional request metadata
   *
   * @param url - The URL to send the PUT request to
   * @param meta - Optional request metadata
   * @returns An Observable that emits the response from the PUT request
   */
  public put<T>(url: string, meta?: RequestMeta): Observable<T> {
    // Generate the headers for the request
    const headers = this.createHeaders(meta);
    const context = this.createContext(meta);

    // Create the query parameters for the request
    let params = new HttpParams;
    params = this.addMetaParams(params, meta);

    // Send the PUT request with the specified URL, data, and headers
    return this.http.put<T>(url, meta?.body, { headers, params, context }).pipe(
      catchError((error: ErrorResponse) => {
        throw error;
      })
    );
  }

  /**
   * Deletes a resource from the specified URL.
   *
   * @param url - The URL of the resource to delete.
   * @param meta - Optional metadata for the request.
   * @returns An Observable that emits the response from the server.
   */
  public delete<T>(url: string, meta?: RequestMeta): Observable<T> {
    // Generate headers for the request
    const headers = this.createHeaders(meta);
    const context = this.createContext(meta);

    // Create the query parameters for the request
    let params = new HttpParams;
    params = this.addMetaParams(params, meta);

    // Send a delete request with the specified URL and headers
    return this.http.delete<T>(url, { headers, params, context }).pipe(
      catchError((error: ErrorResponse) => {
        throw error;
      })
    );
  }


  /**
  * Generate the HttpHeaders for the API request.
  *
  * @param authenticate - The authentication level (default: Unauthenticated).
  * @returns The HttpHeaders object.
  */
  private createHeaders(meta?: RequestMeta): HttpHeaders {
    const isMultipartBody = meta?.body instanceof FormData;

    // Set the language header to the current language code
    let headers = new HttpHeaders({
      'Accept-Language': this.languagesService.getCurrentLanguage().code,
    });

    if (!isMultipartBody) {
      headers = headers.set('Content-Type', 'application/json');
    }

    if (meta?.headers) {
      meta.headers.forEach((value, key) => {
        headers = headers.append(key, value);
      });
    }

    // Return the generated headers
    return headers;
  }

  /**
   * Creates request context with per-call behavior toggles.
   */
  private createContext(meta?: RequestMeta): HttpContext {
    let context = new HttpContext();

    if (meta?.suppressErrorAlert) {
      context = context.set(SUPPRESS_ERROR_ALERT, true);
    }

    return context;
  }

  /**
   * Builds the pagination parameters for an HTTP request.
   *
   * @param options - The pagination options.
   * @returns The HTTP parameters.
   */
  public addPaginationParams(params: HttpParams, meta?: RequestMeta): HttpParams {

    if (!meta?.pagination) return params;

    // Check if the page option is provided or if it is 0
    if (meta.pagination?.page_index || meta.pagination?.page_index === 0) {
      // Append the page and per_page parameters to the HttpParams instance
      params = params.append('page', meta.pagination.page_index.toString());
      params = params.append('per_page', meta.pagination.per_page?.toString() || '10');
    }

    // Check if the limit option is provided
    if (meta.pagination?.limit) {
      // Append the limit parameter to the HttpParams instance
      params = params.append('limit', meta.pagination.limit.toString());
    }

    // Return the HttpParams instance
    return params;
  }

  /**
   * Builds HttpParams object with pagination options and filters.
   *
   * @param meta - The request meta object.
   * @returns The built HttpParams object.
   */
  public addMetaParams(params: HttpParams, meta?: RequestMeta): HttpParams {
    // If filters are provided, append each key-value pair to params
    if (!meta || !meta.params) return params;

    Object.entries(meta.params).forEach(([key, value]) => {
      if (!value) return;

      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          params = params.append(`${key}[]`, item.toString());
        });
      }
      else {
        params = params.append(key, value.toString());
      }
    });

    return params;
  }

}
