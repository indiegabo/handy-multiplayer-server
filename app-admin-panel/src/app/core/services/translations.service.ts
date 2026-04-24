import { Injectable, OnDestroy } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Language, LanguagesService } from './languages.service';
import { Translation } from 'src/app/shared/models/translation';

@Injectable({
  providedIn: 'root'
})
export class TranslationsService implements OnDestroy {

  public _currentLanguage?: Language;

  public languagesSub: Subscription;

  constructor(
    private languagesService: LanguagesService,
    private fb: FormBuilder,
  ) {
    this._currentLanguage = this.languagesService.getCurrentLanguage();
    this.languagesSub = this.languagesService.languageChanged$.subscribe(language => this._currentLanguage = language);
  }

  ngOnDestroy(): void {
    this.languagesSub.unsubscribe();
  }

  public currentTitleTranslation(translations: Translation[]): string {
    const translation = translations.find(t => t.locale === this._currentLanguage?.code);
    return translation ? translation.title! : translations[0].title!;
  }

  public currentDescriptionTranslation(translations: Translation[]): string {
    const translation = translations.find(t => t.locale === this._currentLanguage?.code);
    return translation ? translation.description! : translations[0].description!;
  }

  public createTranslationForm(locale: string, translatable_type: string, translation?: Translation): FormGroup {
    const cId = new FormControl(translation ? translation.id : '');
    const cTranslatable_id = new FormControl(translation ? translation.translatable_id : '');
    const cLocale = new FormControl(locale, [Validators.required]);
    const cTitle = new FormControl(translation ? translation.title : '', []);
    const cDescription = new FormControl(translation ? translation.description : '', []);

    return this.fb.group({
      id: cId,
      translatable_id: cTranslatable_id,
      locale: cLocale,
      title: cTitle,
      description: cDescription,
    });
  }
}
