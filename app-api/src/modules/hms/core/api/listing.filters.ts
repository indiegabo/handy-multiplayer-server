import { PaginationFilters } from "./pagination/pagination.filters";
import { SortFilters } from "./sorting/sort.filters";
import { IntersectionType } from "@nestjs/mapped-types";

/**
 * Compose both filters to extend in feature DTOs.
 */
export class ListingFilters extends IntersectionType(
    PaginationFilters,
    SortFilters,
) { }
