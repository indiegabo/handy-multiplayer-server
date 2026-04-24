// src/common/pagination/sort.filters.ts
import { SortRule } from "@hms/shared-types/hms";
import { Transform } from "class-transformer";
import { IsOptional, IsString } from "class-validator";

/**
 * Parses sort query parameters into structured SortRule[].
 * Accepted forms:
 * - sort=username:asc,id:desc
 * - sort=username:asc&sort=id:desc
 * - sort=username  (defaults to asc)
 */
function parseSortParam(
    value: unknown,
): SortRule[] | undefined {
    if (value === undefined || value === null) return undefined;

    const pushRule = (
        acc: SortRule[],
        token: string,
    ) => {
        const [rawField, rawDir] = token
            .split(":")
            .map((s) => s?.trim())
            .filter(Boolean);

        if (!rawField) return acc;

        const dir = (rawDir ?? "asc")
            .toLowerCase();

        const direction =
            dir === "desc" ? "desc" : "asc";

        acc.push({
            field: rawField,
            direction,
        });
        return acc;
    };

    if (Array.isArray(value)) {
        return value.reduce(
            (acc, v) => {
                if (typeof v !== "string") {
                    return acc;
                }
                const parts = v
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean);
                for (const p of parts) {
                    pushRule(acc, p);
                }
                return acc;
            },
            [] as SortRule[],
        );
    }

    if (typeof value === "string") {
        const parts = value
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean);
        return parts.reduce(
            (acc, p) => pushRule(acc, p),
            [] as SortRule[],
        );
    }

    return undefined;
}

export class SortFilters {
    @IsOptional()
    @Transform(({ value }) => parseSortParam(value))
    sort?: SortRule[];
}
