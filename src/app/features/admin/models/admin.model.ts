export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string | null;
}

export interface CatTipoUniversoAdmin {
  id: number;
  nombre: string;
  fondoUrl: string | null;
}

export interface GuardarCatTipoUniversoRequest {
  nombre: string;
  descripcion: string | null;
}

export interface AventuraAdmin {
  idAventura: number;
  tituloAventura: string;
  tieneCaratula: boolean;
  caratulaUrl: string | null;
  tituloCampana: string;
  tituloUniverso: string;
  emailAutor: string | null;
  estadosVersiones: string[];
  cantidadPartidas: number;
  cantidadValoraciones: number;
}

export interface SolicitudPublicacionAdmin {
  idVersionAventura: number;
  version: number;
  fechaSolicitud: string | null;
  idAventura: number;
  tituloAventura: string;
  descripcionAventura: string | null;
  tieneCaratula: boolean;
  caratulaUrl: string | null;
  tituloCampana: string;
  tituloUniverso: string;
  tiposUniverso: string[];
  cantidadActos: number;
  cantidadEscenas: number;
  cantidadNodos: number;
  cantidadFinales: number;
}

// --- Corrección de textos de la versión publicada ---

export type ElementoTexto =
  | 'Aventura'
  | 'Acto'
  | 'Escena'
  | 'Nodo'
  | 'ContenidoNodo'
  | 'Opcion'
  | 'Final'
  | 'Caracteristica'
  | 'Evento';

export type CampoTexto = 'Titulo' | 'Descripcion' | 'Texto' | 'Nombre';

export interface CambioTexto {
  elemento: ElementoTexto;
  id: number;
  campo: CampoTexto;
  valor: string | null;
}

export interface ContenidoTextos {
  idContenidoNodo: number;
  orden: number;
  texto: string | null;
}

export interface OpcionTextos {
  idOpcion: number;
  codigo: string;
  texto: string;
}

export interface NodoTextos {
  idNodo: number;
  codigo: string;
  titulo: string;
  contenidos: ContenidoTextos[];
  opciones: OpcionTextos[];
}

export interface EscenaTextos {
  idEscena: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  nodos: NodoTextos[];
}

export interface ActoTextos {
  idActo: number;
  codigo: string;
  titulo: string;
  descripcion: string | null;
  escenas: EscenaTextos[];
}

export interface FinalTextos {
  idFinal: number;
  codigo: string;
  titulo: string;
  texto: string;
}

export interface VariableTextos {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface TextosAventura {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
  version: number;
  tieneVersionEnEdicion: boolean;
  actos: ActoTextos[];
  finales: FinalTextos[];
  caracteristicas: VariableTextos[];
  eventos: VariableTextos[];
}
