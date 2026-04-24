import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NothingHereComponent } from './nothing-here.component';
import { TranslateModule } from '@ngx-translate/core';



@NgModule({
  declarations: [
    NothingHereComponent
  ],
  imports: [
    CommonModule,
    TranslateModule,

  ],
  exports: [
    NothingHereComponent
  ]
})
export class NothingHereModule { }
