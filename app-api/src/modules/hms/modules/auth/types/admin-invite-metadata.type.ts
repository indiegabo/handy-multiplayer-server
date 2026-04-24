/**
 * Metadata stored alongside an admin invitation one-time token.
 */
export type AdminInviteMetadata = {
    inviter_id: string;
    invitee_email: string;
};