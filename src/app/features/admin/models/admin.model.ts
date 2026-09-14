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
