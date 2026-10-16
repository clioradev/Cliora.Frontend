import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { Perfil } from '../models/cuenta.model';

@Injectable({ providedIn: 'root' })
export class CuentaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerPerfil(): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.baseUrl}/Cuenta/Perfil`);
  }

  cambiarNombre(nombre: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Cuenta/Nombre`, { nombre });
  }

  solicitarCambioEmail(emailNuevo: string, password: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/CambioEmail`, { emailNuevo, password });
  }

  reenviarCodigo(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/CambioEmail/Reenviar`, {});
  }

  confirmarCambioEmail(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/CambioEmail/Confirmar`, { codigo });
  }

  cancelarCambioEmail(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Cuenta/CambioEmail`);
  }
}
