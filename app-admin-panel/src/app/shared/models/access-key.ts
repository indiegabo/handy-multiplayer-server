import { HMSUser } from "./user";

export type AccessKey = {
  id: number;
  project_id: number;
  creator_id: number;
  revoker_id?: number;
  name?: string;
  prefix: string;
  suffix: string;
  revoked_at?: Date;
  last_used_at?: Date;
  created_at: Date;
  updated_at: Date;

  creator: HMSUser;
  busy?: boolean;
}

export type AccessKeyCreationData = {
  id: number;
  name?: string;
  key: string;
}
