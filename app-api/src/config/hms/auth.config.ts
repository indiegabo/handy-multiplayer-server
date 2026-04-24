// import { GoogleAuthenticator, SteamAuthenticator } from
// "@src/modules/auth/authenticators/hms-authenticator";

import { TwoFactorMethod } from "@hms/shared-types/hms";
import { OttAuthenticator } from "@src/modules/hms/modules/auth/authenticators/ott-authenticator";
import { PasswordAuthenticator } from "@src/modules/hms/modules/auth/authenticators/password-authenticator";
import { AuthenticatorTwoFAHandler } from "@src/modules/hms/modules/auth/two-fa-handling/authenticator.twofa-handler";
import { EmailTwoFAHandler } from "@src/modules/hms/modules/auth/two-fa-handling/email.twofa-handler";

export const AUTH_CONFIG = {
    /**
     * The list of accepted authenticators to be used by Auth Providers.
     */
    authenticators: [
        {
            name: "password",
            type: PasswordAuthenticator,
        },
        {
            name: "ott",
            type: OttAuthenticator,
        },
        // {
        //   name: 'steam',
        //   type: SteamAuthenticator
        // },
        // {
        //   name: 'google',
        //   type: GoogleAuthenticator
        // },
    ],

    twoFAHandlers: [
        {
            name: TwoFactorMethod.EMAIL,
            type: EmailTwoFAHandler,
        },
        {
            name: TwoFactorMethod.AUTHENTICATOR,
            type: AuthenticatorTwoFAHandler,
        },
        // {
        //   name: 'sms',
        //   type: OttAuthenticator
        // }
    ],

    jwt: {
        end_user: {
            /**
             * Access token TTL in milliseconds.
             */
            accessTokenExpirationTime: 7 * 24 * 60 * 60 * 1000, // 7 days

            /**
             * Window in milliseconds to refresh after access token expiration.
             */
            refreshTimeWindow: 2 * 24 * 60 * 60 * 1000, // 2 days

            /**
             * Max number of refresh rotations for a single refresh token.
             */
            maxNumberOfRefreshes: 8,
        },

        admin: {
            /**
             * Access token TTL in milliseconds.
             */
            accessTokenExpirationTime: 1 * 24 * 60 * 60 * 1000, // 1 day

            /**
             * Window in milliseconds to refresh after access token expiration.
             */
            refreshTimeWindow: 1 * 24 * 60 * 60 * 1000, // 1 day

            /**
             * Max number of refresh rotations for a single refresh token.
             */
            maxNumberOfRefreshes: 1,
        },
    },

    passwords: {
        saltRounds: 12,
    },

    /**
     * OAuth-related configuration.
     * For Twitch, the launcher redirect base must include the fixed prefix
     * up to the token parameter, since the token will be concatenated after it.
     *
     * Example:
     *   sg-launcher://sg-api/auth/twitch/client-callback
     */
    oauth: {
        twitch: {
            /**
             * Base URL used on Twitch callback to redirect the user agent.
             * The OTT value will be concatenated to this base string.
             * Example valid content:
             *   "lung-games-launcher://sg-api/auth/twitch/client-callback"
             */
            ottRedirectBaseUrl: "lung-games-launcher://sg-api/auth/twitch/client-callback",

            /**
             * Scopes requested from Twitch OAuth.
             * See: https://dev.twitch.tv/docs/authentication/scopes/
             */
            scopes: [
                "user:read:email",
                "chat:read",
                "chat:edit",
                "channel:read:redemptions",
                "channel:manage:broadcast",
                "moderator:read:followers",
                "moderator:read:chatters",
                "moderator:read:shoutouts",
                "channel:moderate",
                "bits:read",
                "channel:read:subscriptions",
            ] as string[],
        },
    },
};
