import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

export const rolGuard = (rol: string): CanActivateFn => () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.tieneRol(rol)) {
    return true;
  }

  return router.createUrlTree(['/']);
};
