import { ListingFilters } from '@hms-module/core/api/listing.filters';
import {
    IsOptional, IsString, Matches,
} from 'class-validator';

export class GetAdminUsersFilter extends ListingFilters {
    @IsOptional()
    @IsString()
    term?: string;
}
