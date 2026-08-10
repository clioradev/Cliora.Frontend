import { Routes } from '@angular/router';
import { FinalComponent } from './pages/final/final.component';
import { PartidaComponent } from './pages/partida/partida.component';
import { PortadaAventuraComponent } from './pages/portada-aventura/portada-aventura.component';
import { UniversoListComponent } from './pages/universo-list/universo-list.component';

export const HOME_ROUTES: Routes = [
  { path: '', component: UniversoListComponent },
  { path: 'aventura/:idAventura/portada', component: PortadaAventuraComponent },
  { path: 'partida/:idNodo', component: PartidaComponent },
  { path: 'final/:idFinal', component: FinalComponent },
];
