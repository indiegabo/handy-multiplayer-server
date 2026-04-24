import { SortRule } from "./api";
import { MediaView } from "./media";

/**
 * Type representing different user types in the system
 */
export type UserType = 'end_user' | 'admin';

/**
 * Represents detailed information about a user
 */
export type UserBackofficeViewDto = {
    /**
     * Unique identifier for the user
     */
    id: string;
    /**
     * Optional admin ID associated with this user
     */
    admin_id?: string;
    /**
     * User's email address
     */
    email: string;
    /**
     * Optional username
     */
    username?: string;

    /**
     * Optional display name
     */
    display_name?: string;

    /**
     * Whether two-factor authentication is enabled for this user
     */
    two_factor_enabled: boolean;

    /*
     * The media view of the user's profile picture
     */
    profile_picture?: MediaView;
}

/**
 * Represents detailed information about an admin user
 */
export type AdminUserBackofficeViewDto = {
    /**
     * Unique identifier for the admin user
     */
    id: string;
    /**
     * Admin's email address
     */
    email: string;
    /**
     * Admin's full name
     */
    name: string;
    /**
     * Optional admin permissions
     */
    admin_permissions?: AdminPermissions;
    /**
     * Whether this admin is the owner
     */
    is_owner: boolean;
    /**
     * Optional date when this admin became owner
     */
    became_owner_at?: Date;

    /*
     * The media view of the user's profile picture
     */
    profile_picture?: MediaView;
}


/**
 * Represents admin permissions structure
 */
export type AdminPermissions = {
    /**
     * Whether the admin has all permissions
     */
    all?: boolean;
    /**
     * Module-specific permissions
     */
    modules?: {
        /**
         * Permissions for users module
         */
        users?: boolean | string[];
        /**
         * Permissions for content module
         */
        content?: boolean | string[];
        /**
         * Permissions for settings module
         */
        settings?: boolean | string[];
    };
    /**
     * When permissions were granted
     */
    granted_at?: string;
    /**
     * Who granted these permissions
     */
    granted_by?: number;
    /**
     * Custom permissions beyond standard modules
     */
    custom_permissions?: Record<string, boolean | string[]>;
}

export type UsersListFilters = {
    term?: string;
    username?: string;
    page?: number;
    per_page?: number;
    sort?: SortRule[];
};

/**
 * Request DTO for presigned upload URL.
 */
export type RequestProfileUploadUrlDto = {
    filename: string;
    content_type: string;
};

/**
 * Finalize DTO for presigned upload flow.
 */
export type FinalizeProfileUploadDto = {
    file_key: string;          // same key used in the PUT
    filename: string;
    mimetype: string;
    size?: number;
    metadata?: Record<string, any>;
};