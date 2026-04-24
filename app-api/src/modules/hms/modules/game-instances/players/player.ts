/**
 * Represents a player in the game instance.
 */
export type Player = {
    user: HMSUser,
}

/**
 * Represents a user in the HMS api user.
 */
export type HMSUser = {
    id: string,
    email: string,
    username?: string,
}