import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import {
  AventuraAutor,
  CampanaAutor,
  GuardarAventuraRequest,
  GuardarCampanaRequest,
  GuardarUniversoRequest,
  UniversoAutor,
} from '../models/autor.model';

@Injectable({ providedIn: 'root' })
export class AutorService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getUniversos(): Observable<UniversoAutor[]> {
    return this.http.get<UniversoAutor[]>(`${this.baseUrl}/Autor/Universo`);
  }

  crearUniverso(dto: GuardarUniversoRequest): Observable<UniversoAutor> {
    return this.http.post<UniversoAutor>(`${this.baseUrl}/Autor/Universo`, dto);
  }

  actualizarUniverso(idUniverso: number, dto: GuardarUniversoRequest): Observable<UniversoAutor> {
    return this.http.put<UniversoAutor>(`${this.baseUrl}/Autor/Universo/${idUniverso}`, dto);
  }

  crearCampana(idUniverso: number, dto: GuardarCampanaRequest): Observable<CampanaAutor> {
    return this.http.post<CampanaAutor>(`${this.baseUrl}/Autor/Universo/${idUniverso}/Campana`, dto);
  }

  actualizarCampana(idCampana: number, dto: GuardarCampanaRequest): Observable<CampanaAutor> {
    return this.http.put<CampanaAutor>(`${this.baseUrl}/Autor/Campana/${idCampana}`, dto);
  }

  crearAventura(idCampana: number, dto: GuardarAventuraRequest): Observable<AventuraAutor> {
    return this.http.post<AventuraAutor>(`${this.baseUrl}/Autor/Campana/${idCampana}/Aventura`, dto);
  }

  actualizarAventura(idAventura: number, dto: GuardarAventuraRequest): Observable<AventuraAutor> {
    return this.http.put<AventuraAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}`, dto);
  }

  getAventura(idAventura: number): Observable<AventuraAutor> {
    return this.http.get<AventuraAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}`);
  }

  getSiguienteOrden(idCampana: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/Autor/Campana/${idCampana}/SiguienteOrden`);
  }
}
