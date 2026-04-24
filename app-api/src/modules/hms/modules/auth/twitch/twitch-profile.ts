/**
 * Represents a Twitch user's profile.
 */
export type TwitchProfile = {
    /**
     * Provider name, always 'twitch'.
     */
    provider: 'twitch';

    /**
     * Unique ID of the user on Twitch.
     */
    id: string;

    /**
     * Username in lowercase (no spaces).
     */
    login: string;

    /**
     * Display name (may contain spaces and uppercase letters).
     */
    display_name: string;

    /**
     * Broadcaster type: can be empty, 'affiliate', or 'partner'.
     */
    broadcaster_type: '' | 'affiliate' | 'partner';

    /**
     * User bio.
     */
    description: string;

    /**
     * URL to the user's profile image.
     */
    profile_image_url: string;

    /**
     * URL to the offline image for the user's channel.
     */
    offline_image_url: string;

    /**
     * Total number of channel views.
     */
    view_count: number;

    /**
     * User's email, available only with 'user:read:email' scope.
     */
    email?: string;

    /**
     * Account creation date in ISO string format.
     */
    created_at: string;
}

export type TwitchProfileResponse = {
    data: TwitchProfile[];
}