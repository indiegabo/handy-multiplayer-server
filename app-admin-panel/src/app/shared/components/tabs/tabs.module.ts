import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabGroupComponent } from './tab-group/tab-group.component';
import { TabContentComponent } from './tab-content/tab-content.component';
import { TabComponent } from './tab/tab.component';
import { MaterialModule } from '../material/material.module';
import { TabContentWrapperComponent } from './tab-content-wrapper/tab-content-wrapper.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { DragDropModule } from '@angular/cdk/drag-drop';

@NgModule({
  declarations: [
    TabGroupComponent,
    TabContentComponent,
    TabComponent,
    TabContentWrapperComponent,
  ],
  imports: [
    CommonModule,
    MaterialModule,
    DragDropModule,

    FontAwesomeModule,
  ],
  exports: [
    TabGroupComponent,
    TabContentComponent,
    TabComponent,
    TabContentWrapperComponent,
    DragDropModule,
  ]
})
export class TabsModule { }
