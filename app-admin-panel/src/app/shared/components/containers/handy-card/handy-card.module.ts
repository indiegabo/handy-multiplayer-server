import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyCardComponent } from './handy-card.component';
import { HandyCardBodyComponent } from './handy-card-body/handy-card-body.component';
import { HandyCardHeaderComponent } from './handy-card-header/handy-card-header.component';

@NgModule({
  declarations: [
    HandyCardComponent,
    HandyCardBodyComponent,
    HandyCardHeaderComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
  ],
  exports: [
    HandyCardComponent,
    HandyCardBodyComponent,
    HandyCardHeaderComponent
  ]
})
export class HandyCardModule { }
