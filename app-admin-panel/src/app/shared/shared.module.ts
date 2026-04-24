import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedDirectivesModule } from './directives/shared-directives.module';
import { SharedComponentsModule } from './components/shared-components.module';
import { SharedPipesModule } from './pipes/shared-pipes.module';
import { HMSModule } from './hms/hms.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    SharedComponentsModule,
  ],
  exports: [
    SharedDirectivesModule,
    SharedComponentsModule,
    SharedPipesModule,
    HMSModule,
  ],
})
export class SharedModule { }
