import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CornerButtonComponent } from './corner-button.component';
import { MaterialModule } from '../material/material.module';



@NgModule({
  declarations: [
    CornerButtonComponent
  ],
  imports: [
    CommonModule,
    MaterialModule,

  ],
  exports: [
    CornerButtonComponent
  ]
})
export class CornerButtonModule { }
