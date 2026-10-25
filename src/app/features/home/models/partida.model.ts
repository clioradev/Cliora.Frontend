export interface EmpezarPartidaResponse {
  idPartida: number;
  idNodoActual: number;
}

export type NivelDificultad = 'Facil' | 'Normal' | 'Dificil';

export interface Opcion {
  idOpcion: number;
  texto: string;
  nivelDificultad: NivelDificultad | null;
}

export type TipoContenidoNodo = 'Texto' | 'Imagen' | 'Audio';

export interface ContenidoNodo {
  idContenidoNodo: number;
  orden: number;
  tipo: TipoContenidoNodo;
  texto: string | null;
  imagenUrl: string | null;
  audioUrl: string | null;
}

export interface Nodo {
  idNodo: number;
  titulo: string;
  contenidos: ContenidoNodo[];
  opciones: Opcion[];
  esLibro: boolean;
  /** Universo de rol: se puede ver el personaje. */
  esRpg: boolean;
  /** Universo infantil: la primera imagen se queda a la vista mientras se lee. */
  esInfantil: boolean;
  puedeVolverAtras: boolean;
  escenaDescripcion: string | null;
  porcentajeProgreso: number | null;
  jugadoresEnEsteNodo: number;
  jugadoresTotalesAventura: number;
  /** Solo llegan para administradores (null para el resto). */
  codigoNodo: string | null;
  codigoNodoAnterior: string | null;
}

export interface TiradaResultado {
  exito: boolean;
  /** false en universos que no son de rol: solo vale `exito`, el resto llega vacío. */
  detallada: boolean;
  /** Sistema de tiradas del universo: ver TIPO_TIRADA_* en universo.model. */
  tipoTirada: number;
  dados: number[];
  aciertos: number;
  nombreCaracteristica: string;
  valorCaracteristica: number;
  nombreModificador: string | null;
  valorModificador: number;
  /** 4d6 y D20: suma final. Porcentaje: el d100 sacado. */
  total: number;
  dificultad: number;
  /** 4d6 y D20: la dificultad (éxito si total ≥ objetivo). Porcentaje: característica + modificador − dificultad (éxito si total ≤ objetivo). */
  objetivo: number;
}

export interface ElegirOpcionResponse {
  idNodo: number | null;
  idFinal: number | null;
  tirada: TiradaResultado | null;
}

export interface CaracteristicaValor {
  nombre: string;
  valor: number;
}

export interface GrupoCaracteristica {
  tipo: string;
  caracteristicas: CaracteristicaValor[];
}

export interface Personaje {
  grupos: GrupoCaracteristica[];
}

export interface Final {
  idFinal: number;
  texto: string;
  imagenUrl: string | null;
}

export interface FinalizarAventuraResponse {
  idAventura: number;
  /** Aventura de un universo infantil: al terminar no se pide valoración. */
  esInfantil: boolean;
}

export interface ContinuarInfo {
  idNodo: number;
  idAventura: number;
}

export interface VolverAtrasResponse {
  idNodoActual: number;
}

export interface BloqueDiario {
  texto: string;
  esOpcionElegida: boolean;
  idEscena: number | null;
  escenaDescripcion: string | null;
  idActo: number | null;
  actoDescripcion: string | null;
}
