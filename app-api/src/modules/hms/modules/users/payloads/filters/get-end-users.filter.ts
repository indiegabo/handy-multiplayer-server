import { ListingFilters } from '@hms-module/core/api/listing.filters';
import {
    IsOptional, IsString, Matches,
} from 'class-validator';

/**
 * Filters for end-user listing. Supports username/display_name search,
 * generic "q" term (ILIKE on both), and base pagination via inheritance.
 */
export class GetEndUsersFilter extends ListingFilters {
    @IsOptional()
    @IsString()
    term?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[a-zA-Z0-9_-]{0,24}$/)
    username?: string;
}
