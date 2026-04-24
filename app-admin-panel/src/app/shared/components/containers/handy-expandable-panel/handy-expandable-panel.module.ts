import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandyExpandablePanelComponent } from './handy-expandable-panel.component';
import { MaterialModule } from '../../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyExpandablePanelBodyComponent } from './handy-expandable-panel-body/handy-expandable-panel-body.component';
import { HandyExpandablePanelHeaderComponent } from './handy-expandable-panel-header/handy-expandable-panel-header.component';



@NgModule({
  declarations: [
    HandyExpandablePanelComponent,
    HandyExpandablePanelBodyComponent,
    HandyExpandablePanelHeaderComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
  ],
  exports: [
    HandyExpandablePanelComponent,
    HandyExpandablePanelBodyComponent,
    HandyExpandablePanelHeaderComponent
  ]
})
export class HandyExpandablePanelModule { }
