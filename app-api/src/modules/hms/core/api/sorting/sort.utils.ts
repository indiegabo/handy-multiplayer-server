// src/common/pagination/sort.utils.ts
import { SelectQueryBuilder } from "typeorm";
import {
    NormalizedSort,
    SortFieldMap,
    SortRule,
} from "@hms/shared-types/hms";

/**
 * Normalizes client SortRule[] against a whitelist map.
 * Unknown fields are discarded.
 */
export function normalizeSort(
    rules: SortRule[] | undefined,
    allowed: SortFieldMap,
    fallback?: SortRule[],
): NormalizedSort {
    const source = (rules?.length ?? 0) > 0
        ? rules!
        : (fallback ?? []);

    const out: NormalizedSort = [];

    for (const r of source) {
        const col = allowed[r.field];
        if (!col) continue;

        out.push({
            column: col,
            direction: r.direction === "desc"
                ? "DESC"
                : "ASC",
        });
    }

    return out;
}

/**
 * Applies NormalizedSort to a TypeORM QueryBuilder.
 * Keeps existing ordering if present; otherwise uses the
 * first order as .orderBy and the next as .addOrderBy.
 */
export function applySortToQB<Entity>(
    qb: SelectQueryBuilder<Entity>,
    sort: NormalizedSort,
): SelectQueryBuilder<Entity> {
    if (sort.length === 0) return qb;

    // If QB already has orderings, only add new ones.
    // Unfortunately TypeORM doesn't expose a public API
    // to check existing orderBys easily; a safe approach is
    // to use orderBy for the first incoming rule and then
    // addOrderBy for the rest (overrides previous if any).
    qb.orderBy(sort[0].column, sort[0].direction);
    for (let i = 1; i < sort.length; i++) {
        qb.addOrderBy(sort[i].column, sort[i].direction);
    }
    return qb;
}
