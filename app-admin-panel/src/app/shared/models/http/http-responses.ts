/**
 * HTTP status code for a successful request.
 *
 * Typical use: a GET or POST that completed without errors.
 */
export const HTTP_SUCCESS = 200;

/**
 * HTTP status code for a created resource.
 *
 * Typical use: POST that created a new resource (201).
 */
export const HTTP_CREATED = 201;

/**
 * HTTP status code for a bad request (invalid input).
 */
export const HTTP_BAD_REQUEST = 400;

/**
 * HTTP status code for unauthorized access (authentication required).
 */
export const HTTP_UNAUTHORIZED = 401;

/**
 * HTTP status code for forbidden access (authenticated but not allowed).
 */
export const HTTP_FORBIDDEN = 403;

/**
 * HTTP status code for resource not found.
 */
export const HTTP_NOT_FOUND = 404;

/**
 * HTTP status code for validation/semantic errors (unprocessable entity).
 */
export const HTTP_UNPROCESSABLE_ENTITY = 422;

/**
 * HTTP status code for server errors.
 */
export const HTTP_INTERNAL_SERVER_ERROR = 500;

/**
 * Metadata returned along with list responses.
 *
 * - `total`: total number of items available on the server.
 * - `per_page`: items returned per page.
 * - `page_index`: current page index (0-based or 1-based depending on API).
 */
export interface ResponseMeta {
  total?: number;
  per_page?: number;
  page_index?: number;
}

/**
 * Pagination parameters sent to the API when requesting paged data.
 */
export interface PaginationMeta {
  page: number;
}

/**
 * Canonical error payload returned by the server API.
 *
 * - `status_code`: numeric server status code.
 * - `messages`: array of human-readable error messages.
 * - `timestamp`: ISO-8601 timestamp describing when the error occurred on server.
 * - `path`: request path that produced the error.
 */
export type ErrorResponse = {
  status_code: number;
  messages: string[];
  timestamp: string;
  path: string;
}

/**
 * Alternate internal error shape used in some codepaths.
 *
 * - `messages`: structured error message entries.
 * - `meta`: additional error metadata.
 */
export type Error = {
  messages: ErrorMessage[];
  meta: ErrorResponseMeta;
}

/**
 * Additional metadata for structured errors.
 */
export interface ErrorResponseMeta {
  code: number;
  data?: any;
}

/**
 * Structured error message entry.
 *
 * - `text`: main human-readable message.
 * - `helper`: optional helper text with additional context.
 */
export interface ErrorMessage {
  text: string;
  helper?: string;
}

