import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from './main.component';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { SharedModule } from '../../shared/shared.module';
import { NgSelectModule } from '@ng-select/ng-select';
import { RouterModule, Routes } from '@angular/router';
import { ViewTemplateModule } from './view-template/view-template.module';

const routes: Routes = [
  {
    path: 'dashboard',
    component: MainComponent,
    loadChildren: () => import('./dashboard/dashboard.module').then(m => m.DashboardModule)
  },
        {
    path: 'hms',
    component: MainComponent,
    loadChildren: () => import('./hms/hms.module').then(m => m.HMSModule)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    MainComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ViewTemplateModule,
    SharedModule,

    FormsModule,
    NgSelectModule,
    FontAwesomeModule,
  ]
})
export class MainModule {

}
