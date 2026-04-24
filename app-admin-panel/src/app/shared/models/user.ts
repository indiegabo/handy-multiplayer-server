import { Media } from "./media";

export type UserType = 'end_user' | 'admin';

export type HMSUser = {
  id: number;
  admin_id?: number;
  email: string;
  username: string;
  display_name?: string;
  two_factor_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export type AdminUser = {
  id: number;
  email: string;
  name?: string;
  admin_permissions?: AdminPermissions;
  is_owner: boolean;
  became_owner_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export type AdminPermissions = {
  all?: boolean;
  modules?: {
    users?: boolean | string[];
    content?: boolean | string[];
    settings?: boolean | string[];
    // Adicione outros módulos conforme necessário
  };
  granted_at?: string;
  granted_by?: number; // ID do admin que concedeu as permissões
  custom_permissions?: Record<string, boolean | string[]>;
}
