export interface Aventura {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
}

export interface Campana {
  idCampana: number;
  titulo: string;
  descripcion: string | null;
  aventuras: Aventura[];
}

export interface Universo {
  idUniverso: number;
  titulo: string;
  descripcion: string | null;
  campanas: Campana[];
}
