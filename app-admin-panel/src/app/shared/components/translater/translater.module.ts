import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslaterComponent } from './translater.component';
import { TranslateModule } from '@ngx-translate/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [
    TranslaterComponent,
  ],
  imports: [
    CommonModule,

    MaterialModule,
    TranslateModule,
    ReactiveFormsModule,
  ],
  exports: [
    TranslaterComponent,
  ]
})
export class TranslaterModule { }
