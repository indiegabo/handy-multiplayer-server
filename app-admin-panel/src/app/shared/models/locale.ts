import { Translation } from "./translation";

export interface Locale {
  code: string,
  name: string,
  translations?: Translation[],
}
