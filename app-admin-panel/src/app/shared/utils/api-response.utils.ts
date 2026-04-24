import {
  ApiResponse, PaginatedApiResponse, PaginationMeta,
} from '@hms/shared-types';

/**
 * Ensures an ApiResponse<T[]> has a pagination meta and returns it as
 * PaginatedApiResponse<T[]>. Throws if the pagination fields are missing.
 */
export function ensurePaginated<T>(
  resp: ApiResponse<T[]>,
): PaginatedApiResponse<T[]> {
  if (!resp.meta) {
    throw new Error('Missing meta in paginated API response.');
  }

  const meta = resp.meta as PaginationMeta & Record<string, any>;

  // Optional runtime safety checks:
  if (
    typeof meta.page !== 'number' ||
    typeof meta.per_page !== 'number' ||
    typeof meta.total !== 'number' ||
    typeof meta.total_pages !== 'number'
  ) {
    throw new Error('Invalid pagination meta in API response.');
  }

  return { data: resp.data, meta };
}

/**
 * Splits the pagination fields from meta and keeps any extra keys.
 */
export function splitMeta(
  meta: PaginationMeta & Record<string, any>,
): { pagination: PaginationMeta; rest: Record<string, any> } {
  const { page, per_page, total, total_pages, ...rest } = meta;

  const pagination: PaginationMeta = { page, per_page, total, total_pages };

  return { pagination, rest };
}

/**
 * Maps a PaginatedApiResponse<T[]> into a front-end friendly structure:
 * items + meta (pagination) + meta_extra (other meta fields).
 */
export function mapListResponse<T>(
  response: PaginatedApiResponse<T[]>,
): { items: T[]; meta: PaginationMeta; meta_extra: Record<string, any> } {
  const { pagination, rest } = splitMeta(response.meta);
  return { items: response.data, meta: pagination, meta_extra: rest };
}
