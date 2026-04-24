import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckIconDirective } from './check-icon.directive';
import { CheckIconComponent } from './check-icon.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';

@NgModule({
  declarations: [
    CheckIconDirective,
    CheckIconComponent,
  ],
  imports: [
    CommonModule,
    FontAwesomeModule,
  ],
  exports: [CheckIconDirective]
})
export class CheckIconModule { }
