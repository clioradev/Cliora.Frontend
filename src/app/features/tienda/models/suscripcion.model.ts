import { TipoUsuario } from '../../../core/auth/usuario.model';

export type PlanSuscripcion = 'Infantil' | 'Juvenil' | 'Ambas';

export const NOMBRE_PLAN: Record<PlanSuscripcion, string> = {
  Infantil: 'Infantil',
  Juvenil: 'Juvenil',
  Ambas: 'Infantil y juvenil',
};

export interface Suscripcion {
  idSuscripcion: number;
  plan: PlanSuscripcion;
  esPrueba: boolean;
  fechaInicio: string;
  /** Hasta cuándo da acceso (UTC). */
  fechaFin: string;
  renovacionAutomatica: boolean;
  importeMensual: number;
}

export interface EstadoSuscripciones {
  planes: { plan: PlanSuscripcion; precioMensual: number }[];
  /** Las que dan acceso ahora (de pago o prueba). */
  activas: Suscripcion[];
  /** Tramos cuya prueba gratuita ya se ha usado. */
  pruebasUsadas: PlanSuscripcion[];
  tramosHijos: TipoUsuario[];
}

export interface EstadoPruebaHijo {
  pruebaDisponible: boolean;
  diasPrueba: number;
}
