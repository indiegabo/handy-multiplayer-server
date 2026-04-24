export type NormalizedPagination = {
    page: number;
    per_page: number;
    offset: number;
};

export type PaginationMeta = {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
};

export type PaginatedResult<T> = {
    items: T[];
    meta: PaginationMeta;
};