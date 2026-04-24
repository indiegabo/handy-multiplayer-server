import { inject, Injector } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/hms/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const injector = inject(Injector);
  const router = inject(Router);
  const authService = injector.get(AuthService);

  // Verifica tanto o estado quanto o token válido
  return authService.checkAuthState().pipe(
    take(1),
    map(isAuthenticated => {
      const hasValidToken = authService.hasValidToken();

      if (isAuthenticated && hasValidToken) {
        return true;
      }

      authService.logout();
      router.navigate(['/auth/login'], {
        queryParams: { returnUrl: state.url },
        replaceUrl: true
      });
      return false;
    })
  );
};

export const notAuthenticatedGuard: CanActivateFn = () => {
  const injector = inject(Injector);
  const router = inject(Router);
  const authService = injector.get(AuthService);

  return authService.checkAuthState().pipe(
    take(1),
    map(isAuthenticated => {
      if (!isAuthenticated) {
        return true;
      }

      // Redirect to home if already authenticated
      router.navigate(['/']);
      return false;
    })
  );
};
