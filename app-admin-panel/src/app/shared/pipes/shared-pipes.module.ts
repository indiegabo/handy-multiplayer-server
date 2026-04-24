import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReplaceSpacesPipe } from './replace-spaces.pipe';
import { DateAsAgoPipe } from './date-as-ago.pipe';
import { FilterLocalesPipe } from './filter-locales.pipe';

@NgModule({
  declarations: [
    ReplaceSpacesPipe,
    DateAsAgoPipe,
    FilterLocalesPipe,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    ReplaceSpacesPipe,
    DateAsAgoPipe,
    FilterLocalesPipe,
  ]
})
export class SharedPipesModule { }
