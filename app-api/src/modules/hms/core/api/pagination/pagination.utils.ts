import { NormalizedPagination, PaginationMeta } from "./pagination.dto";
import { PaginationFilters } from "./pagination.filters";

/**
 * Normalizes pagination input to safe values, respecting bounds.
 */
export function normalizePagination(
    input?: PaginationFilters,
    options?: { perPageDefault?: number; perPageMax?: number },
): NormalizedPagination {
    const perPageDefault = options?.perPageDefault ?? 20;
    const perPageMax = options?.perPageMax ?? 100;

    const per = Math.min(
        Math.max(input?.per_page ?? perPageDefault, 1),
        perPageMax,
    );
    const page = Math.max(input?.page ?? 1, 1);
    const offset = (page - 1) * per;

    return { page, per_page: per, offset };
}

/**
 * Builds a standard meta object from normalized values and total count.
 */
export function buildPaginationMeta(
    normalized: NormalizedPagination,
    total: number,
): PaginationMeta {
    const totalPages = Math.max(Math.ceil(total / normalized.per_page), 1);

    return {
        page: normalized.page,
        per_page: normalized.per_page,
        total,
        total_pages: totalPages,
    };
}