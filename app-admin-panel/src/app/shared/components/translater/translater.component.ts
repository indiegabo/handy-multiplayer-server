import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Translation } from '../../models/translation';
import { Language, LanguagesService } from 'src/app/core/services/languages.service';
import { TranslationsService } from 'src/app/core/services/translations.service';

@Component({
  selector: 'app-translater',
  templateUrl: './translater.component.html',
  styleUrls: ['./translater.component.scss'],
  standalone: false,
})
export class TranslaterComponent implements OnInit {

  @Input('translations') existingTranslations: Translation[] = [];
  @Input('translatable_id') translatable_id?: number;
  @Input('translatable_type') translatable_type!: string;
  @Output('changed') changed$ = new EventEmitter<Translation[]>();

  public languages: Language[];

  public translationsForm = new FormGroup({
    translations: this.fb.array([])
  });

  constructor(
    public fb: FormBuilder,
    private languagesService: LanguagesService,
    private translationsService: TranslationsService,
  ) {
    this.languages = this.languagesService.availableLanguages;
  }

  ngOnInit(): void {
    this.loadForms();
  }

  private loadForms(): void {
    this.languages.forEach(language => {
      const translation = this.existingTranslations.find(t => language.code === t.locale);
      this.translations.push(this.translationsService.createTranslationForm(language.code, this.translatable_type, translation));
    });
  }

  public changed(): void {
    this.changed$.emit(this.translations.value);
  }

  public tabName(translation: Translation): string {
    return translation.locale;
  }

  public get translations(): FormArray {
    return this.translationsForm.get('translations')! as FormArray;
  }



  trackByIndex(index: number, item: any): any {
    return index;
  }
}
