import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { Usuario } from '../../../core/auth/usuario.model';
import { Rol } from '../models/admin.model';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  buscarUsuarios(email: string): Observable<Usuario[]> {
    return this.http.get<Usuario[]>(`${this.baseUrl}/Admin/Usuario`, { params: { email } });
  }

  obtenerRoles(): Observable<Rol[]> {
    return this.http.get<Rol[]>(`${this.baseUrl}/Admin/Rol`);
  }

  anadirRol(idUsuario: number, idRol: number): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/Admin/Usuario/${idUsuario}/Rol/${idRol}`, {});
  }

  quitarRol(idUsuario: number, idRol: number): Observable<Usuario> {
    return this.http.delete<Usuario>(`${this.baseUrl}/Admin/Usuario/${idUsuario}/Rol/${idRol}`);
  }
}
