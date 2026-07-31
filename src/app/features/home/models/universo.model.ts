export interface Aventura {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
  idVersionAventura: number | null;
  estadoPartida: string | null;
  idNodoActual: number | null;
  puedeEmpezarPartida: boolean;
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
