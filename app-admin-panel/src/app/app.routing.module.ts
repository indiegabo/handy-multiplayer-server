import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: 'auth',
    loadChildren: () => import('./features/auth/auth.module').then(m => m.AuthModule)
  },
  {
    path: 'external',
    loadChildren: () => import('./features/external/external.module').then(m => m.ExternalModule)
  },
  {
    path: 'errors',
    loadChildren: () => import('./features/errors/errors.module').then(m => m.ErrorsModule)
  },
  {
    path: 'setup',
    loadChildren: () => import('./features/setup/setup.module').then(m => m.SetupModule),
  },
  {
    path: 'app',
    loadChildren: () => import('./features/main/main.module').then(m => m.MainModule),
    canActivate: [authGuard],
  },
  {
    path: '', redirectTo: 'app', pathMatch: 'full'
  },
  { path: '**', redirectTo: '/errors/not-found' },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, {
      anchorScrolling: 'enabled',
      // enableTracing: true,
    })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
