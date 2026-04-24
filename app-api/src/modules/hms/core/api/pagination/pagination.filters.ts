import {
    IsInt,
    IsOptional,
    Min,
    Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Converts a query value into number or undefined.
 */
function toNumberOrUndefined(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') return undefined;
    const n = Number(value);
    return Number.isNaN(n) ? undefined : n;
}

/**
 * Base pagination DTO to be extended by filter DTOs.
 * Supports querystring values (strings) via Transform.
 */
export class PaginationFilters {
    @IsOptional()
    @Transform(({ value }) => toNumberOrUndefined(value))
    @IsInt()
    @Min(1)
    page?: number;

    @IsOptional()
    @Transform(({ value }) => toNumberOrUndefined(value))
    @IsInt()
    @Min(1)
    @Max(100)
    per_page?: number;
}
