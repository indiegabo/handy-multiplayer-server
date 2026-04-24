import { Localization } from "./localization";
import { Table } from "./table";
import { Project, ProjectLocale } from "./project";
import { Observable, from, map, shareReplay, tap } from "rxjs";
import { LocalizationsService } from "src/app/core/services/localizations.service";

export interface Entry {
  id: number;
  uuid: string;
  readable_key?: string;
  note?: string;
  helper_image_url?: string;
  mother_localization?: Localization;
  localizations: Localization[];
  entry_table?: Table;
}

export type EntryInfo = {
  id: number,
  uuid: string,
  readable_key?: string,
  note?: string,
  helper_image_url?: string,
  word_count: number,
  table_name: string,
  table_description: string,
  character_count: number,
  mother_locale_code: string,
  mother_localization_id: number,
  mother_localization_text?: string,
  mother_localization_image_url?: string,
  mother_localization_video_url?: string,
  mother_localization_audio_url?: string,
}

export class EntryWrapper {
  private _entry?: EntryInfo;
  private _localizations: Map<string, Localization> = new Map();
  private _localizationsBeingLoaded: Map<string, Observable<Localization>> = new Map();

  placeholderText?: string;

  set entry(value: EntryInfo | undefined) {
    this._entry = value;
  }

  get entry(): EntryInfo | undefined {
    return this._entry;
  }

  constructor(private localizationService: LocalizationsService) {
  }

  /**
  * Loads the localization for a given project locale and project.
  * If the localization already exists, it is returned immediately.
  * Otherwise, it is retrieved from the localization service and stored in the map.
  *
  * @param {ProjectLocale} projectLocale - The locale for which the localization is being loaded.
  * @param {Project} project - The project for which the localization is being loaded.
  * @return {Observable<Localization>} An observable that emits the loaded localization.
  */
  loadLocalization(
    projectLocale: ProjectLocale,
    project: Project
  ): Observable<Localization> {

    // Check if the localization already exists
    const existingLocalization = this._localizations.get(projectLocale.code);

    if (existingLocalization) {
      // If the localization exists, return it
      return from([existingLocalization]);
    }
    else if (this._localizationsBeingLoaded.has(projectLocale.code)) {
      // If the localization is being loaded, return the loading observable
      return this._localizationsBeingLoaded.get(projectLocale.code)!;
    }

    // If the localization does not exist, retrieve it from the localization service
    const obs = this.localizationService.getOrCreateLocalization(
      this._entry!,
      project,
      projectLocale
    ).pipe(
      map(res => res.data), // Map the response data to the localization object
      shareReplay(2), // Share the emitted values with multiple subscribers
      tap(localization => {
        // Store the loaded localization in the map
        this._localizations.set(projectLocale.code, localization);
        // Remove the loading observable from the map
        this._localizationsBeingLoaded.delete(projectLocale.code);
      })
    );

    // Store the loading observable in the map
    this._localizationsBeingLoaded.set(projectLocale.code, obs);
    // Return the loading observable
    return obs;
  }

  getPendingLocales(projectLocales: ProjectLocale[]): ProjectLocale[] {
    return projectLocales.filter(locale => {
      const localization = this._localizations.get(locale.code);
      return !localization || !localization.text;
    });
  }
}

export type ManageableEntryCreationData = {
  mother_localization_text: string;
  table: Table;
  project: Project;
}

export type EntryCreationData = {
  mother_localization_text: string;
  readable_key?: string;
  note?: string;
}

export type DetailedEntryCreationData = EntryCreationData & {
  displayable_text?: string;
  word_count?: number;
  character_count?: number;
}

export type EntryUpdateData = {
  id: number;
  mother_localization_text: string;
  readable_key?: string;
  note?: string;
}
