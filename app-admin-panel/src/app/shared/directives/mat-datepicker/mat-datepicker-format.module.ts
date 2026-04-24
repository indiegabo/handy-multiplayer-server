import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDatepickerFormatBrDirective } from './mat-datepicker-format-br.directive';
import { MatDatepickerFormatMonthYearDirective } from './mat-datepicker-format-month-year.directive';



@NgModule({
  declarations: [
    MatDatepickerFormatBrDirective,
    MatDatepickerFormatMonthYearDirective,
  ],
  imports: [
    CommonModule
  ],
  exports: [
    MatDatepickerFormatBrDirective,
    MatDatepickerFormatMonthYearDirective,
  ]
})
export class MatDatepickerFormatModule { }
