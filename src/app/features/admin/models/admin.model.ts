import { Usuario } from '../../../core/auth/usuario.model';

export interface Rol {
  idRol: number;
  nombre: string;
  descripcion: string | null;
}

export interface CatTipoUniversoAdmin {
  id: number;
  nombre: string;
  descripcion: string | null;
  fondoUrl: string | null;
  /** Cuántos universos tienen este tipo (se avisa antes de borrarlo). */
  numeroUniversos: number;
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
  esLibro: boolean;
  /** No hay ninguna aventura antes en su campaña: será gratis tenga el precio que tenga. */
  esPrimera: boolean;
  precio: number | null;
  descuento: number;
}

// --- Tienda ---

export interface PrecioAventuraAdmin {
  idAventura: number;
  tituloAventura: string;
  idCampana: number;
  tituloCampana: string;
  idUniverso: number;
  tituloUniverso: string;
  orden: number;
  visible: boolean;
  esLibro: boolean;
  /** Primera aventura visible de su campaña: siempre gratis. */
  esPrimera: boolean;
  precio: number | null;
  descuento: number;
  cantidadCompras: number;
}

export interface GuardarPrecioRequest {
  /** € con IVA; null o 0 = gratis. */
  precio: number | null;
  /** € de descuento fijo. */
  descuento: number;
}

export interface ParametroAdmin {
  codigo: string;
  valor: number;
  descripcion: string | null;
}

export const PARAMETRO_PRECIO_AVENTURA_INTERACTIVA = 'PRECIO_AVENTURA_INTERACTIVA';

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

/** Usuario tal como lo devuelve la búsqueda del panel de administración. */
export interface UsuarioAdmin extends Usuario {
  /** Aventuras gratis que le quedan por canjear. */
  aventurasGratis: number;
}

export type TipoMovimientoAventuraGratis = 1 | 2 | 3 | 4;

export const TIPOS_MOVIMIENTO_AVENTURA_GRATIS: Record<TipoMovimientoAventuraGratis, string> = {
  1: 'Manual',
  2: 'Valoraciones',
  3: 'Canje',
  4: 'Devolución',
};

export interface MovimientoAventuraGratis {
  tipo: TipoMovimientoAventuraGratis;
  cantidad: number;
  fecha: string;
  nombreAdministrador: string | null;
  tituloAventura: string | null;
  motivo: string | null;
}

export interface AjustarAventurasGratisRequest {
  /** Positiva para regalar, negativa para quitar. */
  cantidad: number;
  motivo: string | null;
}
