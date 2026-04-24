import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitorComponent } from './monitor/monitor.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { RouterModule, Routes } from '@angular/router';
import { MaintenancePanelComponent } from './maintenance-panel/maintenance-panel.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

const routes: Routes = [
  {
    path: 'panel',
    component: MaintenancePanelComponent,
  },
  {
    path: 'monitor',
    component: MonitorComponent,
  },
  {
    path: '',
    redirectTo: 'panel',
    pathMatch: 'full'
  },
];

@NgModule({
  declarations: [
    MonitorComponent,
    MaintenancePanelComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
  ]
})
export class MaintenanceModule { }
