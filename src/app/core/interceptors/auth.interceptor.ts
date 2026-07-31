import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../auth/auth.service';

const AUTH_ENDPOINTS = ['/Permiso/Login', '/Permiso/Refresh', '/Permiso/Registrar'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuthEndpoint = AUTH_ENDPOINTS.some((path) => req.url.includes(path));
  const accessToken = authService.accessToken();

  const authedReq =
    accessToken && !isAuthEndpoint
      ? req.clone({ setHeaders: { Authorization: `Bearer ${accessToken}` } })
      : req;

  return next(authedReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      return authService.refresh().pipe(
        switchMap((response) => {
          const retriedReq = req.clone({
            setHeaders: { Authorization: `Bearer ${response.accessToken}` },
          });
          return next(retriedReq);
        }),
        catchError((refreshError: unknown) => {
          authService.clearSession();
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};
