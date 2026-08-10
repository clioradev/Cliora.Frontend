import { Routes } from '@angular/router';

export const AUTOR_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/panel-autor/panel-autor.component').then((m) => m.PanelAutorComponent),
  },
  {
    path: 'aventura/nueva',
    loadComponent: () =>
      import('./pages/aventura-form/aventura-form.component').then((m) => m.AventuraFormComponent),
  },
  {
    path: 'aventura/:id',
    loadComponent: () =>
      import('./pages/aventura-form/aventura-form.component').then((m) => m.AventuraFormComponent),
  },
  {
    path: 'aventura/:idAventura/nodo/:idNodo',
    loadComponent: () => import('./pages/nodo-form/nodo-form.component').then((m) => m.NodoFormComponent),
  },
];
