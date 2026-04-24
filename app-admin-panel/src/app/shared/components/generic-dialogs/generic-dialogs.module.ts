import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogComponent } from './confirmation-dialog/confirmation-dialog.component';
import { MaterialModule } from '../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyButtonsModule } from '../handy-forms/handy-buttons/handy-buttons.module';



@NgModule({
  declarations: [
    ConfirmationDialogComponent
  ],
  imports: [
    CommonModule,

    MaterialModule,
    FontAwesomeModule,
    HandyButtonsModule,
  ],
  exports: [
    ConfirmationDialogComponent
  ]
})
export class GenericDialogsModule { }
