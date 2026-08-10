import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';

import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { PreferenciasAplicadasService } from './features/configuracion/data-access/preferencias-aplicadas.service';
import { PreferenciasService } from './features/configuracion/data-access/preferencias.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      const preferenciasService = inject(PreferenciasService);
      const preferenciasAplicadas = inject(PreferenciasAplicadasService);

      return auth.tryRestoreSession().pipe(
        switchMap((autenticado) => {
          if (!autenticado) {
            return of(void 0);
          }

          return preferenciasService.obtenerPreferencias().pipe(
            switchMap((preferencias) => {
              preferenciasAplicadas.aplicar(preferencias);
              return of(void 0);
            }),
            catchError(() => of(void 0)),
          );
        }),
      );
    }),
  ],
};
