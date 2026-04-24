import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LoginComponent } from './login/login.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SharedModule } from 'src/app/shared/shared.module';
import { AuthTopBarComponent } from './auth-top-bar/auth-top-bar.component';
import { CreateAdminAccountComponent } from './create-admin-account/create-admin-account.component';
import { RouterModule, Routes } from '@angular/router';
import { notAuthenticatedGuard } from 'src/app/core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [notAuthenticatedGuard]
  },
  {
    path: 'create-admin-account',
    component: CreateAdminAccountComponent,
    canActivate: [notAuthenticatedGuard]
  },
];

@NgModule({
  declarations: [
    LoginComponent,
    AuthTopBarComponent,
    CreateAdminAccountComponent,
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    SharedModule,
    FormsModule,
    ReactiveFormsModule,
    TranslateModule,

  ],
  providers: [
  ],
})
export class AuthModule { }
