import { ProgresoAventuraGratis } from '../../../shared/components/progreso-aventura-gratis/progreso-aventura-gratis.model';

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
  /** Rayitas hacia la siguiente aventura gratis; null para administradores. */
  progreso: ProgresoAventuraGratis | null;
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
  /** Progreso tras guardar; null para administradores. */
  progreso: ProgresoAventuraGratis | null;
}
