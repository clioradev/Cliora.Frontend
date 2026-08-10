import { Usuario } from './usuario.model';

export interface LoginResponse {
  usuario: Usuario;
  accessToken: string;
  expiraEn: string;
}
