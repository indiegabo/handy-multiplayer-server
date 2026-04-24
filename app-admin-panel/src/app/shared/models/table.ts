import { EntryCreationData } from "./entry";

export interface TableType {
  id: TableTypeEnum;
  name: string;
}

export interface Table {
  id: number;
  project_id: number;
  type_id: number;
  name: string;
  description?: string;
  type: TableType;
}

export type TableCreationData = {
  name: string;
  description?: string | null;
  type_id: number;
  entries?: EntryCreationData[];
}

export enum TableTypeEnum {
  Text = 1,
  Image = 2,
  Audio = 3,
  Video = 4,
}
