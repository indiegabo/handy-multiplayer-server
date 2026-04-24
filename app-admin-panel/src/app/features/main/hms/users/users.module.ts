import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from 'src/app/shared/shared.module';
import { CreateAdminInviteComponent } from './create-admin-invite/create-admin-invite.component';

const routes: Routes = [
  {
    path: 'create-admin-invite',
    component: CreateAdminInviteComponent,
  },
  {
    path: '',
    redirectTo: 'create-admin-invite',
    pathMatch: 'full',
  },
];

@NgModule({
  declarations: [
    CreateAdminInviteComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    SharedModule,

  ],
})
export class UsersModule {
}
