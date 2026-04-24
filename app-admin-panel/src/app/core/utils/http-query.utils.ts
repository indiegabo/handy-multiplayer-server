import { PaginationParams, SortRule } from "@hms/shared-types/hms";

/**
 * Allowed value types for query params.
 */
type ParamValue =
    | string
    | number
    | boolean
    | undefined
    | null;

/**
 * Serializes SortRule[] into "f1:asc,f2:desc" or undefined if empty.
 */
export function serializeSort(
    sort?: SortRule[],
): string | undefined {
    if (!sort || sort.length === 0) return undefined;

    const tokens = sort
        .filter(r => !!r?.field)
        .map(r => {
            const dir = (r.direction ?? "asc").toLowerCase();
            const safeDir = dir === "desc" ? "desc" : "asc";
            return `${r.field}:${safeDir}`;
        });

    if (tokens.length === 0) return undefined;
    return tokens.join(",");
}

/**
 * Builds a flat params object suitable for URLs.
 * - Omits null/undefined/empty-string.
 * - Serializes sort using the API's accepted grammar.
 * - Domain-agnostic: supports only pagination, sort, and fields.
 */
export function buildListParams(input: {
    pagination?: PaginationParams;
    sort?: SortRule[];
    fields?: Record<string, ParamValue>;
}): Record<string, string | number | boolean> {
    const out: Record<string, string | number | boolean> = {};

    if (input.pagination?.page !== undefined) {
        out["page"] = input.pagination.page!;
    }

    if (input.pagination?.per_page !== undefined) {
        out["per_page"] = input.pagination.per_page!;
    }

    const sortStr = serializeSort(input.sort);
    if (sortStr) out["sort"] = sortStr;

    if (input.fields) {
        for (const [k, v] of Object.entries(input.fields)) {
            if (v === undefined || v === null || v === "") continue;
            out[k] = v as string | number | boolean;
        }
    }

    return out;
}

/**
 * Encodes a params object into a querystring starting with '?'.
 */
export function toQueryString(
    params?: Record<string, string | number | boolean>,
): string {
    if (!params || Object.keys(params).length === 0) return "";

    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        qp.append(k, String(v));
    }
    return `?${qp.toString()}`;
}
