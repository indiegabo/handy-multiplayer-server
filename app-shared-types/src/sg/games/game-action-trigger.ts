import { ConnectionPlatform } from "./connection-platform";

/**
 * Represents a trigger for a game action, including platform,
 * trigger type, conditions, and enablement.
 */
export interface GameActionTrigger {
    /**
     * Platform where the trigger is active.
     */
    platform: ConnectionPlatform;

    /**
     * Type of trigger.
     */
    trigger_type: string;

    /**
     * Conditions for the trigger.
     */
    conditions: any;

    /**
     * Indicates if the trigger is enabled.
     */
    is_enabled: boolean;
}