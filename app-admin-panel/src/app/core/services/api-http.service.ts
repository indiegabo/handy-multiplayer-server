// src/app/core/services/api-http.service.ts (SEU ARQUIVO EXISTENTE)
import { Injectable } from "@angular/core";
import { map, Observable } from "rxjs";
import { HttpService } from "./http.service";
import { AppSettingsService } from "./app-settings.service";
import { ApiResponse } from "@hms/shared-types/hms";
import { RequestMeta } from
  "src/app/shared/models/http/http-request";
import { toQueryString } from "../utils/http-query.utils";
import { environment } from "src/environments/environment";

@Injectable({ providedIn: "root" })
export class ApiService {
  constructor(
    private http: HttpService,
    private appSettingsService: AppSettingsService,
  ) { }

  get<T>(endpoint: string, meta?: RequestMeta): Observable<T> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.get<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (resp.data === undefined) throw new Error("No data in response");
          return resp.data as T;
        }),
      );
  }

  getWithMetaResponse<T>(
    endpoint: string,
    meta?: RequestMeta,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.get<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp;
        }),
      );
  }

  post<T>(endpoint: string, meta?: RequestMeta): Observable<T> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.post<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp.data;
        }),
      );
  }

  postWithMetaResponse<T>(
    endpoint: string,
    meta?: RequestMeta,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.post<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp;
        }),
      );
  }

  put<T>(endpoint: string, meta?: RequestMeta): Observable<T> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.put<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp.data;
        }),
      );
  }

  putWithMetaResponse<T>(
    endpoint: string,
    meta?: RequestMeta,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.put<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp;
        }),
      );
  }

  delete<T>(endpoint: string, meta?: RequestMeta): Observable<T> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.delete<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp.data;
        }),
      );
  }

  deleteWithMetaResponse<T>(
    endpoint: string,
    meta?: RequestMeta,
  ): Observable<ApiResponse<T>> {
    const url = this.buildUrl(endpoint, meta?.params);
    return this.http.delete<ApiResponse<T>>(url, { ...meta, params: undefined })
      .pipe(
        map((resp) => {
          if (!resp || resp.data === undefined) {
            throw new Error("No data in response");
          }
          return resp;
        }),
      );
  }

  /**
   * Builds full URL with optional query params encoded.
   */
  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number | boolean>,
  ): string {
    if (endpoint.startsWith("/")) endpoint = endpoint.slice(1);
    const base = `${environment.api.baseUrl}/${endpoint}`;
    const qs = toQueryString(params);
    return `${base}${qs}`;
  }
}
