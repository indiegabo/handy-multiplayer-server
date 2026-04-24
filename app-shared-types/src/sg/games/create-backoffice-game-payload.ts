import { GameType } from './game-type';

/**
 * Minimal payload used by backoffice to create a new game.
 */
export type CreateBackofficeGamePayload = {
    name: string;
    type: GameType;
};
