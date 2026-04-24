import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserFieldComponent } from './user-field/user-field.component';
import { MaterialModule } from '../components/material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyFormsModule } from '../components/handy-forms/handy-forms.module';
import { ReactiveFormsModule } from '@angular/forms';
import { LoadingModule } from '../components/loading/loading.module';

@NgModule({
    declarations: [
        UserFieldComponent,
    ],
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MaterialModule,

        FontAwesomeModule,
        HandyFormsModule,
        LoadingModule,
    ],
    exports: [
        UserFieldComponent
    ]
})
export class HMSModule { }
