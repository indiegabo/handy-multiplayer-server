import { GameType } from './game-type';
import { GameAvailability } from './game-availability';

/**
 * Filters used by general games listing endpoints.
 */
export type AllGamesFilters = {
    term?: string;
    type?: GameType;
    availability?: GameAvailability;
};
