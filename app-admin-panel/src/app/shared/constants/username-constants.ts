
/**
 * Regex pattern for twitch like usernames.
 * It matches strings that contains only letters, numbers and underscore and have a length between 3 and 24.
 */
export const USERNAME_PATTERN = '^[a-zA-Z0-9_]{3,24}$';

/**
 * Regex pattern for twitch like usernames without length limits.
 * It matches strings that contains only letters, numbers and underscore.
 */
export const USERNAME_PATTERN_NO_LIMITS = '^[a-zA-Z0-9_]+$';

/**
 * Password pattern that requires:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character (@$!%*?&)
 */
export const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~])[\w!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]{8,}$/;
