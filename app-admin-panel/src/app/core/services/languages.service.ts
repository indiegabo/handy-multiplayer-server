import { CookieService } from 'ngx-cookie-service';
import { EventEmitter, Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { FlagIcon } from 'src/app/shared/models/icon';

export interface Language {
  code: string;
  name: string;
  icon?: FlagIcon;
}

@Injectable({
  providedIn: 'root'
})
export class LanguagesService {

  public availableLanguages: Language[] = [
    { code: 'pt-BR', name: 'Português do Brasil', icon: { name: 'brazil' } },
    { code: 'en-US', name: 'U.S. English', icon: { name: 'united-states-of-america' } },
  ];

  public defaultLanguage: Language;
  public languageChanged$ = new EventEmitter<Language>();

  constructor(
    private cookieService: CookieService,
    // private translateService: TranslateService
  ) {
    this.defaultLanguage = this.availableLanguages[0];
  }

  /**
   * Start Translations
   * ---
   * This function must be used at the app's start.
   */
  public startTranslations(): void {
    // this.translateService.setDefaultLang(this.defaultLanguage.code);
    // if (this.cookieService.check('chosen-language-code')) {
    //   const language = this.availableLanguages.find(lang => lang.code === this.cookieService.get('chosen-language-code'));
    //   if (language) {
    //     this.defineLanguage(language);
    //   }
    // } else {
    //   this.defineLanguage(this.defaultLanguage);
    // }
  }

  /**
   * Define Language
   */
  public defineLanguage(language: Language): void {
    // the lang to use. If the lang isn't available, it will use the current loader to get it
    // this.translateService.use(language.code);
    // this.cookieService.set('chosen-language-code', language.code);
    // this.languageChanged$.emit(language);
  }

  /**
   * Get Current Language
   *
   * @return Language language
   */
  public getCurrentLanguage(): Language {
    return this.defaultLanguage;
    // const languageCode = this.translateService.currentLang;
    // const language = this.availableLanguages.find(lang => lang.code === languageCode);
    // if (language) {
    //   return language;
    // } else {
    //   return this.defaultLanguage;
    // }
  }
}
