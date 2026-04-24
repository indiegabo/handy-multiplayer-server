import { SemanticVersion } from "../versioning/semantic-version";
import { GameVersionState } from "./game-version-state";

/**
 * Interface representing a game version entry.
 * Mirrors all relevant properties from the Version entity for games.
 */
export interface GameVersion {
    /**
     * Unique identifier for the version.
     */
    id: string;

    /**
     * Semantic version information.
     */
    semver: SemanticVersion;

    /**
     * State of the version, using GameVersionState enum.
     */
    state: GameVersionState;

    /**
     * Indicates if this is the current version.
     */
    is_current: boolean;

    /**
     * Indicates if this is a prerelease version.
     */
    is_prerelease: boolean;

    /**
     * Release notes for this version.
     * Can be a localized object or a string.
     */
    notes?: { [locale: string]: string } | string;

    /**
     * Release date of this version.
     */
    release_date?: Date;
}