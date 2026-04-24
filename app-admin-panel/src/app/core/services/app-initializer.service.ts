import { Injectable } from '@angular/core';
import { ThemeService } from './theme.service';
import { LanguagesService } from './languages.service';
import { AppSettingsService } from './app-settings.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(
    private themeService: ThemeService,
    private languageService: LanguagesService,
    private appSettingsService: AppSettingsService,
  ) {
  }

  /**
   * Initializes the application services.
   *
   * @returns Promise<void> A promise that resolves when initialization is complete.
   */
  async init(): Promise<void> {
    this.themeService.start();
    this.languageService.startTranslations();
    this.languageService.defineLanguage(this.languageService.defaultLanguage);
    this.appSettingsService.init();
  }
}

export function initializeApp(appInitService: AppInitService) {
  return (): Promise<any> => {
    return appInitService.init();
  }
}
