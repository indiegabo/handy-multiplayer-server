import { GameVersionState } from '../games/game-version-state';

/**
 * Input DTO for filtering versions.
 * All properties are optional to allow flexible querying.
 */
export interface FilterVersionsInput {
    /**
     * Filter by version state (awaiting approval, development, etc).
     */
    state?: GameVersionState;

    /**
     * Filter by current version flag.
     */
    is_current?: boolean;

    /**
     * Filter by prerelease status.
     */
    is_prerelease?: boolean;

    /**
     * Filter versions created after this date (inclusive).
     */
    created_after?: Date;

    /**
     * Filter versions created before this date (inclusive).
     */
    created_before?: Date;

    /**
     * Filter by semantic version raw string (e.g., "1.2.3-alpha.1").
     * Matches the raw property inside the semver JSONB column.
     */
    semver_raw?: string;

    /**
     * Filter by game ID (entity_id).
     * Use this to retrieve versions belonging to a specific game.
     */
    game_id?: string;

    /**
     * Filter by entity type (game, launcher, etc).
     * Defaults to 'Game' if not specified.
     */
    entity_type?: string;
}
