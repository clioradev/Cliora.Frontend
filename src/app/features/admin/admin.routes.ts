import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  { path: '', redirectTo: 'aventuras', pathMatch: 'full' },
  {
    path: 'aventuras',
    loadComponent: () =>
      import('./components/solicitudes-publicacion/solicitudes-publicacion.component').then(
        (m) => m.SolicitudesPublicacionComponent,
      ),
  },
  {
    path: 'roles',
    loadComponent: () => import('./components/roles/roles.component').then((m) => m.RolesComponent),
  },
  {
    path: 'tipos-universo',
    loadComponent: () =>
      import('./components/tipos-universo/tipos-universo.component').then((m) => m.TiposUniversoComponent),
  },
  {
    path: 'eliminar-aventuras',
    loadComponent: () =>
      import('./components/eliminar-aventuras/eliminar-aventuras.component').then(
        (m) => m.EliminarAventurasComponent,
      ),
  },
];
