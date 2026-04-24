/**
 * Event name emitted when a new HMS end user is created via Twitch OAuth.
 */
export const END_USER_CREATED_FROM_TWITCH_EVENT =
    'hms.auth.end-user.created-from-twitch';

/**
 * Payload dispatched after a brand-new end user is created by Twitch login.
 */
export type EndUserCreatedFromTwitchEvent = {
    userId: string;
    twitchUsername: string;
    twitchDisplayName: string;
    twitchProfileImageUrl: string;
};