export interface UltimaValoracion {
  idUsuario: number;
  nombreUsuario: string;
  puntuacion: number;
  comentario: string | null;
  fecha: string;
}

export interface MiValoracion {
  puedeValorar: boolean;
  puntuacion: number | null;
  comentario: string | null;
}

export interface GuardarValoracionRequest {
  idAventura: number;
  puntuacion: number;
  comentario: string | null;
}

export interface Valoracion {
  idValoracion: number;
  idAventura: number;
  puntuacion: number;
  comentario: string | null;
  fechaValoracion: string;
  fechaActualizacion: string | null;
}
