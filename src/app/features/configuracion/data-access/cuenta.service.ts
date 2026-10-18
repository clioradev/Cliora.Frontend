import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { DatosHijo } from '../../../core/auth/usuario.model';
import { Hijo, Perfil } from '../models/cuenta.model';

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

  cambiarFechaNacimiento(fechaNacimiento: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Cuenta/FechaNacimiento`, { fechaNacimiento });
  }

  obtenerHijos(): Observable<Hijo[]> {
    return this.http.get<Hijo[]>(`${this.baseUrl}/Cuenta/Hijos`);
  }

  crearHijo(datos: DatosHijo): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/Hijos`, datos);
  }

  actualizarHijo(idHijo: number, datos: DatosHijo): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Cuenta/Hijos/${idHijo}`, datos);
  }

  /** Vacía, quita el acceso propio. */
  cambiarAccesoHijo(idHijo: number, password: string): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Cuenta/Hijos/${idHijo}/Acceso`, { password });
  }

  bajaHijo(idHijo: number, passwordPadre: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/Hijos/${idHijo}/Baja`, { passwordPadre });
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

  cambiarComunicaciones(sinComunicaciones: boolean): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Cuenta/Comunicaciones`, { sinComunicaciones });
  }

  /** Envía (o reenvía) el código de baja al email de la cuenta. */
  solicitarBaja(): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/Baja`, {});
  }

  comprobarCodigoBaja(codigo: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/Baja/Comprobar`, { codigo });
  }

  confirmarBaja(codigo: string, motivo: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Cuenta/Baja/Confirmar`, { codigo, motivo });
  }

  cancelarBaja(): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Cuenta/Baja`);
  }
}
