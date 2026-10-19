/** Tramo de lector: decide qué universos ve el usuario. */
export type TipoUsuario = 'Infantil' | 'Juvenil' | 'Adulto';

export interface Usuario {
  idUsuario: number;
  nombre: string;
  /** Null en las cuentas de hijos, que entran con el email del padre. */
  email: string | null;
  tipoUsuario: TipoUsuario;
  /** Cuenta de hijo: no compra ni ve la tienda. */
  esHijo: boolean;
  /** Hijo con contraseña propia: puede cerrar sesión. El resto se queda fijo en su perfil. */
  accesoPropio: boolean;
  roles: string[];
  activo: boolean;
  fechaRegistro: string;
  fechaUltimoAcceso: string | null;
}

/** Un perfil del selector: el padre o uno de sus hijos. */
export interface PerfilFamilia {
  idUsuario: number;
  nombre: string;
  tipoUsuario: TipoUsuario;
  esHijo: boolean;
}

/** Hijo dado de alta en el registro o en Mi cuenta. */
export interface DatosHijo {
  nombre: string;
  fechaNacimiento: string;
  tipoUsuario: TipoUsuario;
  /** Acceso propio (solo juveniles); vacía o null, sin acceso propio. */
  password: string | null;
  lecturaAutomatica: boolean;
}

export interface DatosRegistro {
  nombre: string;
  email: string;
  password: string;
  fechaNacimiento: string;
  hijos: DatosHijo[];
  /** Casilla de las condiciones de uso y la política de privacidad: el servidor la exige. */
  aceptaCondiciones: boolean;
}
