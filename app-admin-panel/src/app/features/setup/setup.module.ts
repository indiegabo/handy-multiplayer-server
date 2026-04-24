import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from 'src/app/shared/shared.module';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { RouterModule, Routes } from '@angular/router';
import { SetupComponent } from './setup.component';

const routes: Routes = [
  {
    path: 'checkup',
    component: SetupComponent,
    loadChildren: () => import('./checkup/checkup.module').then(m => m.CheckupModule)
  },
  {
    path: 'process',
    component: SetupComponent,
    loadChildren: () => import('./process/process.module').then(m => m.ProcessModule)
  },
  {
    path: '',
    redirectTo: 'checkup',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    SetupComponent
  ],
  imports: [
    CommonModule,
    SharedModule,

    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FontAwesomeModule,
    RouterModule.forChild(routes)
  ],
})
export class SetupModule { }
