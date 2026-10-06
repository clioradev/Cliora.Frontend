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
    path: 'editar-aventuras',
    loadComponent: () =>
      import('./components/editar-aventuras/editar-aventuras.component').then(
        (m) => m.EditarAventurasComponent,
      ),
  },
  {
    path: 'editar-aventuras/:idAventura',
    loadComponent: () =>
      import('./components/corregir-textos/corregir-textos.component').then((m) => m.CorregirTextosComponent),
  },
  { path: 'eliminar-aventuras', redirectTo: 'editar-aventuras', pathMatch: 'full' },
  {
    path: 'precios',
    loadComponent: () => import('./components/precios/precios.component').then((m) => m.PreciosComponent),
  },
  {
    path: 'parametros',
    loadComponent: () => import('./components/parametros/parametros.component').then((m) => m.ParametrosComponent),
  },
];
