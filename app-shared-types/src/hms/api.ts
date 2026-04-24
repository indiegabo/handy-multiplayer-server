export type ApiResponse<T> = {
    data: T;
    meta?: Record<string, any>;
};

export type PaginatedApiResponse<T> = {
    data: T;
    meta: PaginationMeta & Record<string, any>;
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

export type SortDirection = "asc" | "desc";

export type SortRule = {
    field: string;
    direction: SortDirection;
};

export type NormalizedSort = Array<{
    column: string;            // fully qualified db column (e.g., "u.username")
    direction: "ASC" | "DESC";
}>;

/**
 * Map of allowed client fields to QB column (with alias).
 * Example:
 * { username: "u.username", id: "u.id", created_at: "u.created_at" }
 */
export type SortFieldMap = Record<string, string>;

export type PaginationParams = {
    page?: number;
    per_page?: number;
};