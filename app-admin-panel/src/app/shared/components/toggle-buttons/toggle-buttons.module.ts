import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToggleButtonsGroupComponent } from './toggle-buttons-group/toggle-buttons-group.component';
import { MaterialModule } from '../material/material.module';
import { ToggleButtonComponent } from './toggle-button/toggle-button.component';



@NgModule({
  declarations: [ToggleButtonsGroupComponent, ToggleButtonComponent],
  imports: [
    CommonModule,

    MaterialModule,
  ],
  exports: [ToggleButtonsGroupComponent, ToggleButtonComponent]
})
export class ToggleButtonsModule { }
