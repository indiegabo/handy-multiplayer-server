import { Entry, EntryWrapper } from "./entry";
import { ProjectLocale } from "./project";
import { HMSUser } from "./user";

export interface Localization {
  id: number;
  entry_id: number;
  localizer_id: number;
  locale_code: string;
  text?: string;
  image_url?: string;
  video_url?: string;
  audio_url?: string;
  active: boolean;
  entry?: Entry;
  locale?: ProjectLocale;
  localizer?: HMSUser;
}


export type LocalizationData = {
  wrapper: EntryWrapper,
  localization: Localization,
  locale: ProjectLocale,
  missingLocales: ProjectLocale[],
}
