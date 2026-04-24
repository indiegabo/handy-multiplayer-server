import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlagIconComponent } from './flag-icon.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [
    FlagIconComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule
  ],
  exports: [FlagIconComponent]
})
export class FlagIconModule { }
