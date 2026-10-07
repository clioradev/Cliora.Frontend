import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { InformarAlertaResponse, NodoConAlertas } from '../models/alerta.model';

@Injectable({ providedIn: 'root' })
export class AlertaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  /** Solo para revisores: avisa de un error en el nodo en el que está su partida. */
  informar(idNodo: number, comentario: string | null): Observable<InformarAlertaResponse> {
    return this.http.post<InformarAlertaResponse>(`${this.baseUrl}/Alerta/Nodo/${idNodo}`, { comentario });
  }

  getDeAventura(idAventura: number): Observable<NodoConAlertas[]> {
    return this.http.get<NodoConAlertas[]>(`${this.baseUrl}/Alerta/Aventura/${idAventura}`);
  }

  cerrarDeNodo(idNodo: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Alerta/Nodo/${idNodo}/Cerrar`, null);
  }
}
