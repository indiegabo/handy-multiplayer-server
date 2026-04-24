import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HandyInputWrapperComponent } from './handy-input-wrapper/handy-input-wrapper.component';
import { HandyInputDirective } from './handy-input.directive';
import { HandyInputMessageComponent } from './handy-input-message/handy-input-message.component';
import { HandyInputMessagesComponent } from './handy-input-messages/handy-input-messages.component';
import { HandyInputActionButtonComponent } from './handy-input-action-button/handy-input-action-button.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialModule } from '../../material/material.module';
import { HandySingleFieldInputComponent } from './handy-single-field-input/handy-single-field-input.component';
import { HandyButtonsModule } from "../handy-buttons/handy-buttons.module";
import { HandyPasswordFieldComponent } from './handy-password-field/handy-password-field.component';
import { HandyTwoFactorInputComponent } from './handy-two-factor-input/handy-two-factor-input.component';

@NgModule({
  declarations: [
    HandyInputDirective,
    HandyInputWrapperComponent,
    HandyInputMessageComponent,
    HandyInputMessagesComponent,
    HandyInputActionButtonComponent,
    HandySingleFieldInputComponent,
    HandyPasswordFieldComponent,
    HandyTwoFactorInputComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    FontAwesomeModule,
    MaterialModule,
    HandyButtonsModule,

  ],
  exports: [
    HandyInputDirective,
    HandyInputWrapperComponent,
    HandyInputMessageComponent,
    HandyInputMessagesComponent,
    HandyInputActionButtonComponent,
    HandySingleFieldInputComponent,
    HandyPasswordFieldComponent,
    HandyTwoFactorInputComponent,
  ]
})
export class HandyInputsModule { }
