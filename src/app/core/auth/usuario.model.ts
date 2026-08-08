export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  roles: string[];
  activo: boolean;
  fechaRegistro: string;
  fechaUltimoAcceso: string | null;
}
