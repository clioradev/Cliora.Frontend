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
}

export interface TiradaResultado {
  exito: boolean;
  dados: number[];
  aciertos: number;
  nombreCaracteristica: string;
  valorCaracteristica: number;
  total: number;
  dificultad: number;
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
}

export interface FinalizarAventuraResponse {
  idAventura: number;
}
