// src/common/pagination/paginate-query-builder.ts
import { SelectQueryBuilder } from "typeorm";
import {
    PaginationFilters,
} from "./pagination.filters";
import {
    PaginatedResult,
} from "./pagination.dto";
import {
    buildPaginationMeta,
    normalizePagination,
} from "./pagination.utils";
import { applySortToQB, normalizeSort } from "../sorting/sort.utils";
import { SortFieldMap, SortRule } from "@hms/shared-types/hms";

/**
 * Applies pagination (and optional sorting) to a QB and
 * returns items + meta. Caller can pass a whitelist of
 * sortable fields and a default fallback sort.
 */
export async function paginateQueryBuilder<
    Entity,
    ViewDto = Entity
>(
    qb: SelectQueryBuilder<Entity>,
    filters?: PaginationFilters & { sort?: SortRule[] },
    options?: {
        perPageDefault?: number;
        perPageMax?: number;
        mapFn?: (e: Entity) => ViewDto;
        /**
         * Whitelist of client sort fields -> columns.
         * Example: { username: "u.username", id: "u.id" }
         */
        allowedSort?: SortFieldMap;
        /**
         * Default fallback order if client does not send sort
         * or sends only unknown fields.
         * Example: [{ field: "created_at", direction: "desc" }]
         */
        defaultSort?: SortRule[];
    },
): Promise<PaginatedResult<ViewDto>> {
    const norm = normalizePagination(filters, {
        perPageDefault: options?.perPageDefault,
        perPageMax: options?.perPageMax,
    });

    if (options?.allowedSort) {
        const normalizedSort = normalizeSort(
            filters?.sort,
            options.allowedSort,
            options.defaultSort,
        );
        applySortToQB(qb, normalizedSort);
    }

    const [entities, total] = await qb
        .skip(norm.offset)
        .take(norm.per_page)
        .getManyAndCount();

    const items = options?.mapFn
        ? entities.map(options.mapFn)
        : (entities as unknown as ViewDto[]);

    return {
        items,
        meta: buildPaginationMeta(norm, total),
    };
}
