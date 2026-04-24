import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HandyCardComponent } from './handy-card/handy-card.component';
import { MaterialModule } from '../material/material.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { HandyContainerComponent } from './handy-container/handy-container.component';
import { HandyCardModule } from './handy-card/handy-card.module';
import { HandyExpandablePanelModule } from './handy-expandable-panel/handy-expandable-panel.module';



@NgModule({
  declarations: [
    HandyContainerComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,

    FontAwesomeModule,
  ],
  exports: [
    HandyContainerComponent,
    HandyExpandablePanelModule,
    HandyCardModule,
  ]
})
export class ContainersModule { }
