import { UserType } from "./users";

/* ======================= */
/* === Payloads == */
/* ======================= */
export type BasePasswordLoginDto = {
    password: string;
}

export type AdminPasswordLoginDt = BasePasswordLoginDto & {
    email: string;
}

export type OttLoginPayloadDto = {
    /**
     * One-time token used for authentication
     */
    token: string;
}

export type SecondStepLoginPayloadDto = {
    /**
     * Temporary token identifying the 2FA session
     */
    second_step_token: string;
    /**
     * Verification code for 2FA authentication
     */
    code: string
}

export type CreateAdminInvitePayload = {
    invitee_email: string;
}

export type CreateAdminInviteResponseDto = {
    token: string;
    expires_at: string;
}

export type RefreshTokenPayloadDTO = {
    refresh_token: string;
}

export type AdminAccountCreationStartPayload = {
    invite_token: string;
}

export type AdminCreationPayload = {
    email: string;
    name: string;
    password: string;
    password_confirmation: string;
    twofa_token: string;
    twofa_code: string;
};

export type AdminCreationFromInvitePayload = {
    invite_token: string;
};

export type CreateAdminAccountResponseDto = {
    backup_codes: string[],
    admin: AdminUserAuthInfoDto,
}

/* ======================= */
/* === Responses == */
/* ======================= */

/**
 * Base interface for login responses
 *
 * The `requires_2fa` property determines whether the user needs to go through
 * the two-factor authentication process. If `true`, the client should prompt
 * the user to choose a 2FA method. If `false`, the auth fields will be
 * present in the response as `SingleStepLoginResponseDto`.
 */
export type LoginResponseBaseDto = {
    /**
     * Whether the user needs to go through two-factor authentication
     */
    requires_2fa: boolean;
}

/**
 * Represents the structure of a login response.
 */
export type LoginResponseDto = {
    /**
     * The access token used for authenticating API requests.
     */
    access_token: string;

    /**
     * The refresh token used to obtain a new access token.
     */
    refresh_token: string;

    /**
     * Either end user or admin user information.
     */
    user: UserAuthInfoDto | AdminUserAuthInfoDto;
}

/**
 * Represents a login response that includes the authentication tokens,
 * without requiring two-factor authentication.
 */
export type SingleStepLoginResponseDto = LoginResponseBaseDto & LoginResponseDto;

/**
 * Represents a login response that requires two-factor authentication.
 *
 * The client should prompt the user to choose a 2FA method from the list of
 * available methods (`twofa_methods` property). The user will then be
 * required to submit a verification code, which will be validated against
 * the chosen 2FA method.
 *
 * The `second_step_token` is a temporary token that identifies the 2FA
 * session. The client should send this token in the second step of the
 * login process, along with the chosen 2FA method and verification code.
 */
export type Requires2FAResponseDto = LoginResponseBaseDto & {

    twofa: {
        /**
         * Temporary token identifying the 2FA session
         */
        second_step_token: string;

        /**
         * The 2FA method already started
         */
        method: TwoFactorMethod,

        /**
         * A message containing instructions on how the user should proceed.
         */
        message: string;

        /**
         * List of other available 2FA methods
         */
        available_2fa_methods: TwoFactorMethod[];
    }
}

/**
 * Represents the response for the creation of an account already
 * set up for 2FA.
 *
 * It contains the data required to generate a QR code for the user to
 * complete the 2FA setup process.
 */
export type Prepare2FAAccountCreationResponseDto = {

    /**
     * The email address of the user who is setting up 2FA
     */
    email: string;

    /**
     * The URL of the QR code to be displayed to the user
     */
    qrcode_url: string;

    /**
     * The manual entry code that the user can enter in their authenticator app
     */
    manual_entry_code: string;

    /**
     * A token that can be used to complete the 2FA setup process
     */
    setup_token: string;
}

/**
 * Represents a response indicating that the 2FA method was prepared
 */
export type Prepared2FAResponseDto = {
    /**
     * The 2FA method that was prepared.
     */
    twofa_method: TwoFactorMethod;

    /**
     * A message containg instructions on how the user should proceed.
     */
    message: string;
}

/**
 * Response payload for end-user login code requests.
 *
 * The backend resolves the input term (email or username), sends the
 * token when possible, and returns a masked destination email.
 */
export type SendLoginCodeResponseDto = {
    /**
     * Username linked to the recognized account, when available.
     */
    recognized_username: string | null;

    /**
     * Redacted destination email where the token was sent.
     */
    redacted_email: string | null;
}

/**
 * Base interface for user authentication information
 */
export type UserAuthInfoBaseDto = {
    /**
     * Type of the user (end user or admin)
     */
    type: UserType;
}

/**
 * Represents authentication information for a regular end user
 */
export type UserAuthInfoDto = UserAuthInfoBaseDto & {
    /**
     * Unique identifier for the user
     */
    id: string;
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
}

/**
 * Represents authentication information for an admin user
 */
export type AdminUserAuthInfoDto = UserAuthInfoBaseDto & {
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
}

/**
 * The client should store the new tokens securely and use them to
 * authenticate API requests.
 */
export type RefreshTokenResponseDto = {
    /**
     * The new access token used for authenticating API requests.
     */
    access_token: string;

    /**
     * The new refresh token used to obtain a new access token.
     */
    refresh_token: string;
}


/* ======================= */
/* === Enums == */
/* ======================= */

export enum TwoFactorMethod {
    EMAIL = 'email',
    AUTHENTICATOR = 'authenticator',
    SMS = 'sms'
}

/*
 * Regex pattern for twitch like usernames.
 * It matches strings that contains only letters, numbers and underscore and have a length between 4 and 25.
 */
export const USERNAME_PATTERN = /^[a-z0-9_]{4,25}$/;