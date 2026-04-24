import { GameActionTrigger } from "../games/game-action-trigger";
import { ChatCommand } from "./chat-command";

/**
 * Maps a crowd action to its triggers and associated chat commands.
 */
export interface CrowdActionMapping {
    /**
     * Identifier of the mapped action.
     */
    identifier: string;

    /**
     * List of triggers for the action.
     */
    triggers: GameActionTrigger[];

    /**
     * List of chat commands for the action.
     */
    commands: ChatCommand[];
}