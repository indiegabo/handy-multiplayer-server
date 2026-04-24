import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CreateAdminFormComponent } from './create-admin-form/create-admin-form.component';
import { ReactiveFormsModule } from '@angular/forms';
import { MaterialModule } from '../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyFormsModule } from '../handy-forms/handy-forms.module';
import { ContainersModule } from '../containers/containers.module';



@NgModule({
  declarations: [CreateAdminFormComponent],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,

    FontAwesomeModule,
    HandyFormsModule,
    ContainersModule,
  ],
  exports: [CreateAdminFormComponent]
})
export class AuthModule { }
