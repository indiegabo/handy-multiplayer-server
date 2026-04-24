import { HMSUser } from "./user"

export type ProjectCreationFormData = {
  tag: string;
  mother_locale: string;
  description: string | null;
  dummy?: any;
  // locales: string[];
}

export type ProjectCreationData = ProjectCreationFormData & {
  locales: string[];
}

export interface IProject {
  id: number,
  mother_locale_id: number,
  tag: string,
  description?: string,
  active: boolean,
  entries_limit: number,
  entries_count: number,
  user_association?: ProjectAssociation,
  mother_locale?: ProjectLocale,
  locales: ProjectLocale[]
  owner: HMSUser,
}

export class Project implements IProject {
  id: number = 0;
  mother_locale_id: number = 0;
  tag: string = '';
  description?: string;
  active: boolean = true;
  entries_limit: number = 0;
  entries_count: number = 0;
  user_association?: ProjectAssociation;
  mother_locale?: ProjectLocale;
  locales: ProjectLocale[] = [];
  owner: HMSUser = {} as HMSUser;

  private canBeManagedResolved?: boolean;
  private canBeLocalizedResolved?: boolean;

  public get canBeManaged(): boolean {
    if (this.canBeManagedResolved !== undefined) { return this.canBeManagedResolved; }

    if (!this.user_association) { return false; }

    const { role } = this.user_association;
    this.canBeManagedResolved = role.id === ProjectRoleEnum.Manager || role.id === ProjectRoleEnum.Owner;
    return this.canBeManagedResolved;
  }

  public get canBeLocalized(): boolean {
    if (this.canBeLocalizedResolved !== undefined) { return this.canBeLocalizedResolved; }
    if (!this.user_association) { return false; }

    this.canBeLocalizedResolved = this.user_association.role.id === ProjectRoleEnum.Localizer;
    return this.canBeLocalizedResolved;
  }
}

export interface ProjectLocale {
  id: number,
  project_id: number,
  code: string;
  busy?: boolean;
}

export interface ProjectAssociation {
  id: number,
  project_id: number,
  associate_id: number,
  role_id: number,
  associator_id: number,
  associate: HMSUser,
  role: ProjectRole,
  associator?: HMSUser,
  locales?: ProjectLocale[],
  // Logic stuff
  busy?: boolean;
}

export interface ProjectRole {
  id: number,
  name: string
}

export enum ProjectRoleEnum {
  Owner = 1,
  Manager = 2,
  Localizer = 3,
}

export enum ProjectRoleUsableEnum {
  Manager = 2,
  Localizer = 3,
}

export type EntriesInfo = {
  total_of_entries: number,
  entries_limit: number,
  tokens: number,
}
