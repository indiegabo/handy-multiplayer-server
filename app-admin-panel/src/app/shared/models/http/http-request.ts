/**
 * Metadata contract for HTTP requests executed by HttpService.
 * This structure centralizes body payload, query params, headers
 * and pagination hints to keep calls consistent across the app.
 */
export interface RequestMeta {
  /**
   * Optional bearer token string. When provided, the HTTP layer may
   * include it in an Authorization header or use it for auth flows.
   */
  access_token?: string;

  /**
   * Pagination directives that are translated into query parameters
   * such as 'page', 'per_page' and/or 'limit' by the HttpService.
   */
  pagination?: PaginationOptions;

  /**
   * Arbitrary request payload. Consumed by POST/PUT methods in
   * HttpService as the request body when present.
   */
  body?: any;

  /**
   * Query parameter bag. Each key is encoded as a query param and
   * values are stringified. Arrays become repeated 'key[]' entries.
   */
  params?: any;

  /**
   * Additional HTTP headers for the request. Keys are header names
   * and values are their string values.
   */
  headers?: Map<string, string>;

  /**
   * When true, suppresses automatic error snackbars triggered by
   * the global ErrorInterceptor for this request.
   */
  suppressErrorAlert?: boolean;
}

/**
 * Pagination options used to build standard query parameters.
 * Fields are optional and only appended when defined.
 */
export interface PaginationOptions {
  /**
   * Zero-based page index. Serialized as 'page'.
   */
  page_index?: number;

  /**
   * Page size. Serialized as 'per_page'. Server defaults may apply
   * when omitted.
   */
  per_page?: number;

  /**
   * Upper bound for items returned. Serialized as 'limit'. Useful for
   * endpoints that prefer 'limit' over 'per_page'.
   */
  limit?: number;
}
