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
  cantidadDecision: number | null;
  caratulaUrl?: string | null;
  autor: string | null;
  duracion: number | null;
  esLibro: boolean;
  enlaceCompra: string | null;
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

// Sistema de tiradas de un universo (EnumTipoTirada en el back). Lo eligen todas sus aventuras.
export const TIPO_TIRADA_ACIERTOS_4D6 = 1;
export const TIPO_TIRADA_D20 = 2;
export const TIPO_TIRADA_PORCENTAJE = 3;

export const TIPO_TIRADA_OPCIONES: (OpcionEnum & { ayuda: string })[] = [
  {
    valor: TIPO_TIRADA_ACIERTOS_4D6,
    etiqueta: '4d6 por aciertos',
    ayuda: 'Se tiran 4 dados de seis; cada 4 o más es un acierto. Éxito si característica + modificador + aciertos alcanza la dificultad.',
  },
  {
    valor: TIPO_TIRADA_D20,
    etiqueta: 'D20 + modificador',
    ayuda: 'Se tira un dado de veinte. Éxito si dado + característica + modificador alcanza la dificultad. Cada punto vale un 5 %.',
  },
  {
    valor: TIPO_TIRADA_PORCENTAJE,
    etiqueta: 'Porcentaje (d100)',
    ayuda: 'Se tira un d100. Éxito si sale igual o menos que característica + modificador − dificultad (la dificultad es una penalización; 0 = sin penalización).',
  },
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
  fondoUrl: string | null;
  fechaPublicacion: string | null;
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
}

export type OrdenUniversos = 'reciente' | 'valoracion';

export const ORDEN_UNIVERSOS_OPCIONES: { valor: OrdenUniversos; etiqueta: string }[] = [
  { valor: 'reciente', etiqueta: 'Reciente' },
  { valor: 'valoracion', etiqueta: 'Valoración' },
];
