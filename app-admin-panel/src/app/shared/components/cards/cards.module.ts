import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LungCardComponent } from './lung-card/lung-card.component';
import { MaterialModule } from '../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



@NgModule({
  declarations: [
    LungCardComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
  ],
  exports: [
    LungCardComponent
  ]
})
export class CardsModule { }
