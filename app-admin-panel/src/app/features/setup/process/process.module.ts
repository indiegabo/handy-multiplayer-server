import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Routes } from '@angular/router';
import { OwnershipStablishmentComponent } from './ownership-stablishment/ownership-stablishment.component';
import { SharedModule } from 'src/app/shared/shared.module';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgSelectModule } from '@ng-select/ng-select';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { StartOwnerCreationFormComponent } from './start-owner-creation-form/start-owner-creation-form.component';

const routes: Routes = [
  {
    path: 'ownership-stablishment',
    component: OwnershipStablishmentComponent,
  },
  {
    path: '',
    redirectTo: 'ownership-stablishment',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    OwnershipStablishmentComponent,
    StartOwnerCreationFormComponent
  ],
  imports: [
    CommonModule,
    SharedModule,

    FormsModule,
    ReactiveFormsModule,
    NgSelectModule,
    FontAwesomeModule,
    RouterModule.forChild(routes),
  ]
})
export class ProcessModule { }
