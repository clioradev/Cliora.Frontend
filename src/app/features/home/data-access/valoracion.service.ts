import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { GuardarValoracionRequest, MiValoracion, UltimaValoracion, Valoracion } from '../models/valoracion.model';

@Injectable({ providedIn: 'root' })
export class ValoracionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  guardarValoracion(dto: GuardarValoracionRequest): Observable<Valoracion> {
    return this.http.post<Valoracion>(`${this.baseUrl}/Valoracion`, dto);
  }

  getMiValoracion(idAventura: number): Observable<MiValoracion> {
    return this.http.get<MiValoracion>(`${this.baseUrl}/Valoracion/${idAventura}/Mia`);
  }

  getValoracionesAventura(idAventura: number): Observable<UltimaValoracion[]> {
    return this.http.get<UltimaValoracion[]>(`${this.baseUrl}/Valoracion/Aventura/${idAventura}`);
  }

  getValoracionesCampana(idCampana: number): Observable<UltimaValoracion[]> {
    return this.http.get<UltimaValoracion[]>(`${this.baseUrl}/Valoracion/Campana/${idCampana}`);
  }

  getValoracionesUniverso(idUniverso: number): Observable<UltimaValoracion[]> {
    return this.http.get<UltimaValoracion[]>(`${this.baseUrl}/Valoracion/Universo/${idUniverso}`);
  }
}
