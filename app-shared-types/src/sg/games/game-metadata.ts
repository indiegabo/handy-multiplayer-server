import { GameType } from "./game-type";
import { GameAvailability } from "./game-availability";
import { ConnectionPlatform } from "./connection-platform";
import { GameVersion } from "./game-version";

/**
 * Defines the structure for game metadata.
 * This interface aggregates all relevant information about a game,
 * including identification, descriptive data, platform support,
 * availability, and versioning.
 *
 * @interface GameMetadata
 */
export interface GameMetadata {
    /**
     * Unique identifier for the game.
     * Used to reference the game across systems and databases.
     *
     * @type {string}
     */
    game_id: string;

    /**
     * Human-readable name of the game.
     * Displayed in user interfaces and listings.
     *
     * @type {string}
     */
    name: string;

    /**
     * Detailed description of the game.
     * Provides context and information for players and administrators.
     *
     * @type {string}
     */
    description: string;

    /**
     * Optional URL to the game's cover image.
     * Used for visual representation in UIs.
     *
     * @type {string}
     */
    cover_url?: string;

    /**
     * Enumerated type indicating the game's category.
     * Determines gameplay mechanics and integration logic.
     *
     * @type {GameType}
     */
    type: GameType;

    /**
     * Availability status of the game.
     * Controls access and visibility for users.
     *
     * @type {GameAvailability}
     */
    availability: GameAvailability;

    /**
     * List of supported connection platforms.
     * Specifies wich streaming platforms the game supports.
     *
     * @type {ConnectionPlatform[]}
     */
    platforms: ConnectionPlatform[];

    /**
     * Current version information for the game.
     * Used for update management and compatibility checks.
     *
     * @type {GameVersion}
     */
    current_version: GameVersion;
}