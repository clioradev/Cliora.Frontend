export interface Usuario {
  idUsuario: number;
  nombre: string;
  email: string;
  rol: string;
  activo: boolean;
  fechaRegistro: string;
  fechaUltimoAcceso: string | null;
}
