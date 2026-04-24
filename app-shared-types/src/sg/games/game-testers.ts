import { MediaView } from "../../hms/media";

/**
 * Represents a tester assigned to a game.
 * Stores identification, assignment, and status metadata for testers.
 * Used for administrative control and audit of game testing permissions.
 *
 * @class GameTesterView
 */
export class GameTesterView {
    /**
     * Unique identifier for the tester record.
     * @type {string}
     */
    id!: string;

    /**
     * User ID of the tester.
     * @type {string}
     */
    user_id!: string;

    /**
     * Game ID being tested.
     * @type {string}
     */
    game_id!: string;

    /**
     * Username of the tester.
     * @type {string}
     */
    username!: string;

    /**
     * Optional display name for the tester.
     * @type {string}
     */
    display_name?: string;

    /**
     * Optional profile picture for the tester.
     * @type {MediaView}
     */
    profile_picture?: MediaView;

    /**
     * Expiration date for tester access.
     * Null if access does not expire.
     * @type {Date | null}
     */
    expires_at: Date | null = null;

    /**
     * Date when access was revoked.
     * Null if not revoked.
     * @type {Date | null}
     */
    revoked_at: Date | null = null;

    /**
     * Optional notes about the tester or assignment.
     * @type {string | null}
     */
    notes: string | null = null;

    /**
     * Admin ID who granted access.
     * @type {string}
     */
    granted_by_admin_id!: string;

    /**
     * Admin ID who revoked access.
     * Null if not revoked.
     * @type {string | null}
     */
    revoked_by_admin_id: string | null = null;

    /**
     * Date when the tester record was created.
     * @type {Date}
     */
    created_at!: Date;

    /**
     * Date when the tester record was last updated.
     * @type {Date}
     */
    updated_at!: Date;
}