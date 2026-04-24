import { ConnectionPlatform } from "./connection-platform";
import { GameAvailability } from "./game-availability";
import { GameType } from "./game-type";

/**
 * Describes the domain representation of a Game within the SG ecosystem.
 * It aggregates identification, classification, availability, and supported
 * connection modules required by clients and backoffice tools.
 */
export interface Game {
  /**
   * Unique identifier for the game entity. It is expected to be a stable
   * UUID or database-generated string used across services and clients.
   */
  id: string;

  /**
   * Human-readable game name used for display in catalogs and admin panels.
   */
  name: string;

  /**
   * Optional text providing a concise description of the game.
   */
  description?: string;

  /**
   * Absolute or resolvable URL pointing to the game's cover image asset.
   */
  cover_url: string;

  /**
   * Classification of the game used for routing and feature toggles.
   */
  type: GameType;

  /**
   * Availability state indicating whether the game is visible and playable
   * in the platform for end users.
   */
  availability: GameAvailability;
}