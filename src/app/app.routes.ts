import { Routes } from '@angular/router';
import { ShellComponent } from './layout/shell/shell.component';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { rolGuard } from './core/guards/rol.guard';

export const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      {
        path: 'login',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/public/pages/login/login.component').then((m) => m.LoginComponent),
      },
      {
        path: 'registro',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/public/pages/registro/registro.component').then((m) => m.RegistroComponent),
      },
      {
        path: 'olvido-contrasena',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/public/pages/olvido-contrasena/olvido-contrasena.component').then(
            (m) => m.OlvidoContrasenaComponent,
          ),
      },
      {
        path: 'restablecer-contrasena',
        canActivate: [guestGuard],
        loadComponent: () =>
          import('./features/public/pages/restablecer-contrasena/restablecer-contrasena.component').then(
            (m) => m.RestablecerContrasenaComponent,
          ),
      },
      {
        path: 'configuracion',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/configuracion/pages/configuracion-shell/configuracion-shell.component').then(
            (m) => m.ConfiguracionShellComponent,
          ),
        children: [
          { path: '', redirectTo: 'preferencias', pathMatch: 'full' },
          {
            path: 'preferencias',
            loadComponent: () =>
              import('./features/configuracion/pages/configuracion/configuracion.component').then(
                (m) => m.ConfiguracionComponent,
              ),
          },
          {
            path: 'contrasena',
            loadComponent: () =>
              import('./features/configuracion/pages/cambiar-password/cambiar-password.component').then(
                (m) => m.CambiarPasswordComponent,
              ),
          },
          {
            path: 'sesion',
            loadComponent: () =>
              import('./features/configuracion/pages/cerrar-sesion/cerrar-sesion.component').then(
                (m) => m.CerrarSesionComponent,
              ),
          },
        ],
      },
      {
        path: 'autor',
        canActivate: [authGuard, rolGuard('Autor')],
        loadChildren: () => import('./features/autor/autor.routes').then((m) => m.AUTOR_ROUTES),
      },
      {
        path: 'admin',
        canActivate: [authGuard, rolGuard('Administrador')],
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
      },
      {
        path: '',
        canActivate: [authGuard],
        loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES),
      },
    ],
  },
];
