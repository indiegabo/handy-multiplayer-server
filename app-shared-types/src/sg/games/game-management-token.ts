import { AdminUserBackofficeViewDto } from "../../hms/users";

/**
 * Payload for creating a new Game Management Token (GMT).
 */
export type GMTCreationPayload = {
    /**
     * Optional list of scopes for the token.
     */
    scopes?: string[];

    /**
     * Optional arbitrary data for the token.
     */
    data?: any;
};

/**
 * Base structure for a Game Management Token (GMT).
 */
export type ManagementTokenBase = {
    /**
     * Unique identifier for the token.
     */
    id: string;

    /**
     * Optional creator user ID.
     */
    creator_id?: number;

    /**
     * Associated game ID.
     */
    game_id: string;

    /**
     * List of scopes granted by the token.
     */
    scopes: string[];

    /**
     * Arbitrary data associated with the token.
     */
    data: any;

    /**
     * Optional revoker user ID.
     */
    revoker_id?: number;

    /**
     * Optional revocation timestamp.
     */
    revoked_at?: Date;

    /**
     * Creation timestamp.
     */
    created_at: Date;

    /**
     * Last update timestamp.
     */
    updated_at: Date;

    /**
     * Optional creator user object.
     */
    creator?: AdminUserBackofficeViewDto;

    /**
     * Optional revoker user object.
     */
    revoker?: AdminUserBackofficeViewDto;
};

/**
 * Structure for a created Game Management Token (GMT),
 * including the generated token string.
 */
export type GMTCreated = ManagementTokenBase & {
    /**
     * The generated token string.
     */
    token: string;
};

/**
 * Structure for a listed Game Management Token (GMT),
 * including a partial view token string.
 */
export type GMTListed = ManagementTokenBase & {
    /**
     * The partial view token string.
     */
    partial_view_token: string;
};