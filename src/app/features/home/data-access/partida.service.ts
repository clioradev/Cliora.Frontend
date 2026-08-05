import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import {
  ContinuarInfo,
  ElegirOpcionResponse,
  EmpezarPartidaResponse,
  Final,
  FinalizarAventuraResponse,
  Nodo,
  Personaje,
} from '../models/partida.model';

@Injectable({ providedIn: 'root' })
export class PartidaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  empezar(idVersionAventura: number): Observable<EmpezarPartidaResponse> {
    return this.http.post<EmpezarPartidaResponse>(`${this.baseUrl}/Partida/Empezar`, { idVersionAventura });
  }

  getNodo(idNodo: number): Observable<Nodo> {
    return this.http.get<Nodo>(`${this.baseUrl}/Partida/Nodo/${idNodo}`);
  }

  getPersonaje(idNodo: number): Observable<Personaje> {
    return this.http.get<Personaje>(`${this.baseUrl}/Partida/Personaje/${idNodo}`);
  }

  elegirOpcion(idOpcion: number): Observable<ElegirOpcionResponse> {
    return this.http.post<ElegirOpcionResponse>(`${this.baseUrl}/Partida/ElegirOpcion`, { idOpcion });
  }

  getFinal(idFinal: number): Observable<Final> {
    return this.http.get<Final>(`${this.baseUrl}/Partida/Final/${idFinal}`);
  }

  finalizarAventura(idFinal: number): Observable<FinalizarAventuraResponse> {
    return this.http.post<FinalizarAventuraResponse>(`${this.baseUrl}/Partida/Finalizar`, { idFinal });
  }

  obtenerContinuar(): Observable<ContinuarInfo | null> {
    return this.http.get<ContinuarInfo | null>(`${this.baseUrl}/Partida/Continuar`);
  }

  reiniciarAventura(idAventura: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Partida/Reiniciar`, { idAventura });
  }
}
