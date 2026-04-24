import { CrowdActionMapping } from "../crowd-actions/crowd-action-mapping";
import { ConnectionPlatform } from "./connection-platform";

/**
 * Represents the configuration for a game streamer on a specific platform.
 */
export interface GameStreamerConfig {
    /**
     * Unique identifier for the streamer.
     */
    streamer_id: string;

    /**
     * Unique identifier for the game
     */
    game_id: string;

    /**
     * Streaming platform.
     */
    platform: ConnectionPlatform;

    /**
     * Channel name or ID.
     */
    channel: string;

    /**
     * Indicates if the config is active.
     */
    is_active: boolean;

    /**
     * Mappings of crowd actions to triggers and commands.
     */
    crowd_action_mappings: CrowdActionMapping[];
}