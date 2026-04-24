import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckupComponent } from './checkup.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule, Routes } from '@angular/router';


const routes: Routes = [
  {
    path: '',
    component: CheckupComponent,
  },
];

@NgModule({
  declarations: [CheckupComponent],
  imports: [
    CommonModule,
    SharedModule,
    FormsModule,
    NgSelectModule,
    FontAwesomeModule,
    RouterModule.forChild(routes)
  ]
})
export class CheckupModule { }
