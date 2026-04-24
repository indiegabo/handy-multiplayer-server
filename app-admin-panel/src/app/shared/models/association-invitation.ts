import { Project, ProjectLocale, ProjectRole } from "./project";
import { HMSUser } from "./user";

export type AssociationInvitation = {
  id: number,
  project_id: number,
  role_id: number,
  inviter_id: number,
  invitee_email: string,
  locales?: ProjectLocale[];
  seen: boolean;
  expired: boolean;
  expires_at: Date;
  accepted_at?: Date;
  declined_at?: Date;
  revoked_at?: Date;
  role: ProjectRole;
  inviter: HMSUser;
  invitee: HMSUser;
  revoker?: HMSUser;
  status: InvitationStatus;
  created_at: Date;
  project_tag: string;
  project_owner_username: string;
  project: Project;
}

export type AssociationInvitationCreationData = {
  project_id: number,
  email?: string,
  username?: string,
  role_id: 2 | 3,
  locales: string[],
}

export enum InvitationStatus {
  Pending = 1,
  Expired = 2,
  Accepted = 3,
  Declined = 4,
  Revoked = 5
}
