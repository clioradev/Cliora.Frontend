import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/panel-admin/panel-admin.component').then((m) => m.PanelAdminComponent),
  },
];
