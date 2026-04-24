import { HMSUser } from "./user";

export interface AIModel {
  id: number;
  slug: string;
  display_name: string;
  model_name: string;
  credits_ratio: number;
}

export interface AIUserCredit {
  user_id: number;
  amount: number;
  user?: HMSUser;
}
