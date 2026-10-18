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
  /** Lo que cuesta suelta (con su descuento); null si es gratis. */
  precio: number | null;
  /** Precio antes del descuento, solo si tiene descuento. */
  precioSinDescuento: number | null;
  /** De pago y sin comprar: se muestra con candado. */
  bloqueada: boolean;
  comprada: boolean;
  /** Perfil de hijo: bloqueada hasta que el padre se suscriba o active la prueba. */
  requiereSuscripcion: boolean;
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
  /** Imagen para el listado infantil. */
  imagenUrl: string | null;
  aventuras: Aventura[];
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
  /** Alguna aventura está bloqueada: el título lleva candado. */
  bloqueada: boolean;
  /** Lo que cuestan de golpe las aventuras bloqueadas, con el descuento de campaña. */
  precioCampana: number | null;
  /** Lo que costarían esas mismas aventuras sueltas. */
  precioCampanaSinDescuento: number | null;
}

export interface Universo {
  idUniverso: number;
  titulo: string;
  descripcion: string | null;
  campanas: Campana[];
  tipos: string[];
  fondoUrl: string | null;
  /** Carátula grande del listado infantil. */
  imagenUrl: string | null;
  fechaPublicacion: string | null;
  puntuacionMedia: number | null;
  ultimaValoracion: UltimaValoracion | null;
  /** El usuario le ha dado al pulgar. */
  esFavorito: boolean;
}

export type FiltroFavoritos = 'todos' | 'favoritos' | 'no-favoritos';

export const FILTRO_FAVORITOS_OPCIONES: { valor: FiltroFavoritos; etiqueta: string }[] = [
  { valor: 'todos', etiqueta: 'Todos los universos' },
  { valor: 'favoritos', etiqueta: 'Solo favoritos' },
  { valor: 'no-favoritos', etiqueta: 'Sin favoritos' },
];

export type OrdenUniversos = 'reciente' | 'valoracion';

export const ORDEN_UNIVERSOS_OPCIONES: { valor: OrdenUniversos; etiqueta: string }[] = [
  { valor: 'reciente', etiqueta: 'Reciente' },
  { valor: 'valoracion', etiqueta: 'Valoración' },
];
