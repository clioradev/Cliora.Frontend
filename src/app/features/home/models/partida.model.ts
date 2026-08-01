export interface EmpezarPartidaResponse {
  idPartida: number;
  idNodoActual: number;
}

export interface Opcion {
  idOpcion: number;
  texto: string;
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

export interface ElegirOpcionResponse {
  idNodo: number | null;
  idFinal: number | null;
}

export interface Final {
  idFinal: number;
  texto: string;
}

export interface FinalizarAventuraResponse {
  idAventura: number;
}
