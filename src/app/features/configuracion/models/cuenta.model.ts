import { TipoUsuario } from '../../../core/auth/usuario.model';
import { ProgresoAventuraGratis } from '../../../shared/components/progreso-aventura-gratis/progreso-aventura-gratis.model';

export interface Perfil {
  nombre: string;
  /** Null en las cuentas de hijos. */
  email: string | null;
  fechaRegistro: string;
  /** 'yyyy-MM-dd'; null en los usuarios anteriores a que fuera obligatoria. */
  fechaNacimiento: string | null;
  /** Perfil de hijo: su nombre, email y contraseña los gestiona el padre. */
  esHijo: boolean;
  /** Email nuevo a la espera de confirmar con el código; null si no hay ninguno. */
  emailPendiente: string | null;
  /** Ha pedido no recibir comunicaciones (novedades, ofertas…). */
  sinComunicaciones: boolean;
  /** Ya se le ha enviado el código de baja y sigue vigente. */
  bajaPendiente: boolean;
  aventurasEmpezadas: number;
  aventurasTerminadas: number;
  valoraciones: number;
  aventurasCompradas: number;
  /** Saldo y rayitas de aventuras gratis; null para administradores. */
  aventurasGratis: ProgresoAventuraGratis | null;
}

/** Un hijo tal como lo ve su padre en Mi cuenta. */
export interface Hijo {
  idUsuario: number;
  nombre: string;
  fechaNacimiento: string | null;
  tipoUsuario: TipoUsuario;
  /** Tramo que le toca hoy por edad; si difiere del actual, se avisa (el cambio no es automático). */
  tipoPropuesto: TipoUsuario | null;
  tieneAccesoPropio: boolean;
  lecturaAutomatica: boolean;
}
