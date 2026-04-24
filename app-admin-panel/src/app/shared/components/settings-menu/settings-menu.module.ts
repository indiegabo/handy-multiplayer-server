import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsMenuComponent } from './settings-menu.component';
import { MaterialModule } from '../material/material.module';
import { FormsModule } from '@angular/forms';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



@NgModule({
  declarations: [SettingsMenuComponent],
  imports: [
    CommonModule,
    MaterialModule,

    FormsModule,
    FontAwesomeModule,
  ],
  exports: [SettingsMenuComponent]
})
export class SettingsMenuModule { }
