export interface AventuraAutor {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  cantidadDecision: number;
  rutaImagen: string | null;
  visible: boolean;
}

export interface CampanaAutor {
  idCampana: number;
  titulo: string;
  descripcion: string | null;
  aventuras: AventuraAutor[];
}

export interface UniversoAutor {
  idUniverso: number;
  titulo: string;
  descripcion: string | null;
  campanas: CampanaAutor[];
}

export interface GuardarUniversoRequest {
  titulo: string;
  descripcion: string | null;
}

export interface GuardarCampanaRequest {
  titulo: string;
  descripcion: string | null;
}

export interface GuardarAventuraRequest {
  titulo: string;
  descripcion: string | null;
  orden: number;
  cantidadDecision: number;
  rutaImagen: string | null;
}
