import { UltimaValoracion } from './valoracion.model';

export interface Aventura {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
  idVersionAventura: number | null;
  estadoPartida: string | null;
  idNodoActual: number | null;
  puedeEmpezarPartida: boolean;
  puntuacionMedia: number | null;
  totalValoraciones: number;
  ultimaValoracion: UltimaValoracion | null;
}

export interface Campana {
  idCampana: number;
  titulo: string;
  descripcion: string | null;
  aventuras: Aventura[];
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
}

export interface Universo {
  idUniverso: number;
  titulo: string;
  descripcion: string | null;
  campanas: Campana[];
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
}
