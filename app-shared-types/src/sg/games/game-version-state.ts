/**
 * Enumerates lifecycle states for game versions.
 *
 * This enum must be used only for game versioning workflows.
 *
 * @enum {number}
 */

export enum GameVersionState {

    /**
     * Version is awaiting development approval to begin work.
     */
    AwaitingDevelopmentApproval = 1,

    /**
     * Version is being prepared and not yet submitted for approval.
     */
    UnderDevelopment = 2,

    /**
     * Version is being tested for release.
     */
    Homologation = 3,

    /**
     * Version is ready for release but not yet released.
     */
    Ready = 4,

    /**
     * Version has been officially released.
     */
    Released = 5,

    /**
     * Version has been canceled and will not proceed to release.
     */
    Canceled = 6,

    /**
     * Version has been rejected and will not be released.
     */
    Rejected = 7,

    /**
     * Version is deprecated and should not be used.
     */
    Deprecated = 8
}
