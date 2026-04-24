import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MessageBoxComponent } from './message-box/message-box.component';
import { MaterialModule } from '../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';



@NgModule({
  declarations: [
    MessageBoxComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
  ],
  exports: [
    MessageBoxComponent,
  ]
})
export class MessageBoxesModule { }
