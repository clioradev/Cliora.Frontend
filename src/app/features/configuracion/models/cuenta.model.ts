import { ProgresoAventuraGratis } from '../../../shared/components/progreso-aventura-gratis/progreso-aventura-gratis.model';

export interface Perfil {
  nombre: string;
  email: string;
  fechaRegistro: string;
  /** Email nuevo a la espera de confirmar con el código; null si no hay ninguno. */
  emailPendiente: string | null;
  aventurasEmpezadas: number;
  aventurasTerminadas: number;
  valoraciones: number;
  aventurasCompradas: number;
  /** Saldo y rayitas de aventuras gratis; null para administradores. */
  aventurasGratis: ProgresoAventuraGratis | null;
}
