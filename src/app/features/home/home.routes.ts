import { Routes } from '@angular/router';
import { FinalComponent } from './pages/final/final.component';
import { PartidaComponent } from './pages/partida/partida.component';
import { UniversoListComponent } from './pages/universo-list/universo-list.component';

export const HOME_ROUTES: Routes = [
  { path: '', component: UniversoListComponent },
  { path: 'partida/:idNodo', component: PartidaComponent },
  { path: 'final/:idFinal', component: FinalComponent },
];
