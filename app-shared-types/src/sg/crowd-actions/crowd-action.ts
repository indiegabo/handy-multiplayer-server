import { GameActionTrigger } from "../..";
import { Argument } from "./argument";

/**
 * Represents a crowd action that can be triggered in the game.
 */
export interface CrowdAction {
    /**
     * Unique identifier for the action.
     */
    identifier: string;

    /**
     * Human-readable name for the action.
     */
    name: string;

    /**
     * Description of the action.
     */
    description: string;

    /**
     * Arguments required for the action.
     */
    args: Argument[];
}