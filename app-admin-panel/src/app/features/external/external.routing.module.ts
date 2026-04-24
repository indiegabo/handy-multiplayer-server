import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { RedirectorComponent } from './redirector/redirector.component';

const routes: Routes = [
  {
    path: '',
    component: RedirectorComponent,
  }
];
@NgModule({
  imports: [
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class ExternalRoutingModule { }
