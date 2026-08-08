import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { catchError, map, Observable, of, tap } from 'rxjs';
import { API_BASE_URL } from '../api/api-base-url.token';
import { LoginResponse } from './login-response.model';
import { Usuario } from './usuario.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  private readonly _accessToken = signal<string | null>(null);
  private readonly _currentUser = signal<Usuario | null>(null);

  readonly accessToken = this._accessToken.asReadonly();
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = computed(() => this._accessToken() !== null);
  readonly roles = computed(() => this._currentUser()?.roles ?? []);

  tieneRol(rol: string): boolean {
    return this.roles().includes(rol);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/Permiso/Login`, { email, password }, { withCredentials: true })
      .pipe(tap((response) => this.setSession(response)));
  }

  register(nombre: string, email: string, password: string): Observable<Usuario> {
    return this.http.post<Usuario>(`${this.baseUrl}/Permiso/Registrar`, { nombre, email, password });
  }

  olvidoContrasena(email: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Permiso/OlvidoContrasena`, { email });
  }

  restablecerContrasena(token: string, nuevaPassword: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Permiso/RestablecerContrasena`, { token, nuevaPassword });
  }

  cambiarContrasena(passwordActual: string, passwordNueva: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Permiso/CambiarContrasena`, { passwordActual, passwordNueva });
  }

  logout(): Observable<void> {
    return this.http
      .post<void>(`${this.baseUrl}/Permiso/Logout`, null, { withCredentials: true })
      .pipe(tap(() => this.clearSession()));
  }

  /** Intenta restaurar sesión a partir de la cookie httpOnly. Nunca lanza. */
  tryRestoreSession(): Observable<boolean> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/Permiso/Refresh`, null, { withCredentials: true })
      .pipe(
        tap((response) => this.setSession(response)),
        map(() => true),
        catchError(() => {
          this.clearSession();
          return of(false);
        }),
      );
  }

  /** Usado por el interceptor para el reintento tras un 401. */
  refresh(): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/Permiso/Refresh`, null, { withCredentials: true })
      .pipe(tap((response) => this.setSession(response)));
  }

  clearSession(): void {
    this._accessToken.set(null);
    this._currentUser.set(null);
  }

  private setSession(response: LoginResponse): void {
    this._accessToken.set(response.accessToken);
    this._currentUser.set(response.usuario);
  }
}
