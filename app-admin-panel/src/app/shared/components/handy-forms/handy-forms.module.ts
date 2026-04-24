import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandyToggleButtonComponent } from './handy-buttons/handy-toggle-button/handy-toggle-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialModule } from '../material/material.module';
import { HandyInputsModule } from './handy-inputs/handy-inputs.module';
import { HandyButtonsModule } from './handy-buttons/handy-buttons.module';

@NgModule({
  declarations: [
  ],
  imports: [
    CommonModule,
    MaterialModule,
    FontAwesomeModule,

  ],
  exports: [
    HandyInputsModule,
    HandyButtonsModule,
  ],
})
export class HandyFormsModule { }
