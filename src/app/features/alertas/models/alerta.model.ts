export interface InformarAlertaResponse {
  numeroAlertas: number;
}

export interface NodoReferencia {
  idNodo: number;
  codigo: string;
  titulo: string;
  /** El nodo se borró después de la alerta (solo puede pasar con el de origen). */
  eliminado: boolean;
}

export interface CapturaCaracteristica {
  codigo: string;
  nombre: string;
  tipo: string;
  valor: number;
  visible: boolean;
}

export interface CapturaEvento {
  codigo: string;
  nombre: string;
  /** Aventura en la que se jugó: puede ser una anterior de la campaña. */
  aventura: string;
}

export interface AlertaNodo {
  idAlertaNodo: number;
  nombreUsuario: string;
  fecha: string;
  comentario: string | null;
  /** null: la alerta se dio en el nodo inicial. */
  nodoOrigen: NodoReferencia | null;
  caracteristicas: CapturaCaracteristica[];
  eventos: CapturaEvento[];
}

export interface NodoConAlertas {
  nodo: NodoReferencia;
  actoTitulo: string;
  escenaTitulo: string;
  version: number;
  /** El mismo nodo en la versión en edición; null si allí ya no existe. */
  idNodoEdicion: number | null;
  numeroAlertas: number;
  alertas: AlertaNodo[];
}
