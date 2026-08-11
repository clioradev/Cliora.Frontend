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
  cantidadDecision: number;
  caratulaUrl?: string | null;
  autor: string | null;
  duracion: number | null;
}

export interface OpcionEnum {
  valor: number;
  etiqueta: string;
}

export const CANTIDAD_DECISION_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Bajo' },
  { valor: 2, etiqueta: 'Medio' },
  { valor: 3, etiqueta: 'Alto' },
];

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
  tipos: string[];
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
}
