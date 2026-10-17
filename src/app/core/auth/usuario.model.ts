/** Tramo de lector: decide qué universos ve el usuario. */
export type TipoUsuario = 'Infantil' | 'Juvenil' | 'Adulto';

export interface Usuario {
  idUsuario: number;
  nombre: string;
  /** Null en las cuentas de hijos, que entran con nombre de usuario. */
  email: string | null;
  nombreUsuario: string | null;
  tipoUsuario: TipoUsuario;
  /** Cuenta de hijo: no compra ni ve la tienda. */
  esHijo: boolean;
  roles: string[];
  activo: boolean;
  fechaRegistro: string;
  fechaUltimoAcceso: string | null;
}
