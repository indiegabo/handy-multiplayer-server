/**
 * Represents the pure data structure of a chat command entity.
 * Used for DTOs, business logic, and any persistence layer.
 */
export interface ChatCommand {
    /**
     * Command name.
     */
    name: string;

    /**
     * List of command aliases.
     */
    aliases: string[];

    /**
     * Command description.
     */
    description: string;

    /**
     * Global cooldown in seconds.
     */
    global_cooldown: number;

    /**
     * User-specific cooldown in seconds.
     */
    user_cooldown: number;

    /**
     * Restricts command to admins.
     */
    admin_only: boolean;

    /**
     * Indicates if the command is enabled.
     */
    is_enabled: boolean;
}