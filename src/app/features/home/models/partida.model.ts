export interface EmpezarPartidaResponse {
  idPartida: number;
  idNodoActual: number;
}

export interface Opcion {
  idOpcion: number;
  texto: string;
}

export interface Nodo {
  idNodo: number;
  titulo: string;
  texto: string;
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
