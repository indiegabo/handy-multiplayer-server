import { GameType } from './game-type';
import { GameAvailability } from './game-availability';
import { ConnectionPlatform } from './connection-platform';
import { SortRule } from '../../hms/api';

/**
 * Filters used by backoffice games listing endpoints (paginated).
 */
export type BackofficeGamesListFilters = {
    term?: string;
    type?: GameType;
    availability?: GameAvailability;
    platform?: ConnectionPlatform;
    page?: number;
    per_page?: number;
    sort?: SortRule[];
};
