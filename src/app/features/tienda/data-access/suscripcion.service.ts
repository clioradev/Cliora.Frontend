import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { EstadoPruebaHijo, EstadoSuscripciones, PlanSuscripcion } from '../models/suscripcion.model';

/** Suscripciones de los perfiles de hijos (pago simulado). */
@Injectable({ providedIn: 'root' })
export class SuscripcionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerEstado(): Observable<EstadoSuscripciones> {
    return this.http.get<EstadoSuscripciones>(`${this.baseUrl}/Suscripcion`);
  }

  suscribir(plan: PlanSuscripcion): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Suscripcion`, { plan });
  }

  cancelarRenovacion(idSuscripcion: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Suscripcion/${idSuscripcion}/Cancelar`, {});
  }

  /** Desde el perfil de un hijo. */
  obtenerEstadoPrueba(): Observable<EstadoPruebaHijo> {
    return this.http.get<EstadoPruebaHijo>(`${this.baseUrl}/Suscripcion/Prueba`);
  }

  /** Desde el perfil de un hijo, con la contraseña del padre. */
  activarPrueba(passwordPadre: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Suscripcion/Prueba`, { passwordPadre });
  }
}
