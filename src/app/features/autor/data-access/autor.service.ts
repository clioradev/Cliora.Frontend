import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import {
  ActoAutor,
  AventuraAutor,
  CampanaAutor,
  CaracteristicaAutor,
  CatTipoCaracteristicaAutor,
  CrearNodoRequest,
  EscenaAutor,
  EventoAutor,
  FinalAutor,
  GuardarActoRequest,
  GuardarAventuraRequest,
  GuardarCampanaRequest,
  GuardarCaracteristicaRequest,
  GuardarEscenaRequest,
  GuardarEventoRequest,
  GuardarFinalRequest,
  GuardarNodoArbolRequest,
  GuardarUniversoRequest,
  NodoArbol,
  NodoAutorResumen,
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

  eliminarUniverso(idUniverso: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Universo/${idUniverso}`);
  }

  eliminarCampana(idCampana: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Campana/${idCampana}`);
  }

  eliminarAventura(idAventura: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Aventura/${idAventura}`);
  }

  crearActo(idAventura: number, dto: GuardarActoRequest): Observable<ActoAutor> {
    return this.http.post<ActoAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Acto`, dto);
  }

  actualizarActo(idActo: number, dto: GuardarActoRequest): Observable<ActoAutor> {
    return this.http.put<ActoAutor>(`${this.baseUrl}/Autor/Acto/${idActo}`, dto);
  }

  eliminarActo(idActo: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Acto/${idActo}`);
  }

  reordenarActos(idAventura: number, ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Acto/Reordenar`, { ids });
  }

  crearEscena(idActo: number, dto: GuardarEscenaRequest): Observable<EscenaAutor> {
    return this.http.post<EscenaAutor>(`${this.baseUrl}/Autor/Acto/${idActo}/Escena`, dto);
  }

  actualizarEscena(idEscena: number, dto: GuardarEscenaRequest): Observable<EscenaAutor> {
    return this.http.put<EscenaAutor>(`${this.baseUrl}/Autor/Escena/${idEscena}`, dto);
  }

  eliminarEscena(idEscena: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Escena/${idEscena}`);
  }

  reordenarEscenas(idActo: number, ids: number[]): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Autor/Acto/${idActo}/Escena/Reordenar`, { ids });
  }

  crearNodo(idEscena: number, dto: CrearNodoRequest): Observable<NodoAutorResumen> {
    return this.http.post<NodoAutorResumen>(`${this.baseUrl}/Autor/Escena/${idEscena}/Nodo`, dto);
  }

  crearNodoDestino(idNodoOrigen: number, dto: CrearNodoRequest): Observable<NodoAutorResumen> {
    return this.http.post<NodoAutorResumen>(`${this.baseUrl}/Autor/Nodo/${idNodoOrigen}/NodoDestino`, dto);
  }

  getNodo(idNodo: number): Observable<NodoArbol> {
    return this.http.get<NodoArbol>(`${this.baseUrl}/Autor/Nodo/${idNodo}`);
  }

  guardarArbolNodo(idNodo: number, dto: GuardarNodoArbolRequest): Observable<NodoArbol> {
    return this.http.put<NodoArbol>(`${this.baseUrl}/Autor/Nodo/${idNodo}/Arbol`, dto);
  }

  eliminarNodo(idNodo: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Nodo/${idNodo}`);
  }

  marcarNodoInicial(idNodo: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Autor/Nodo/${idNodo}/MarcarInicial`, {});
  }

  getFinales(idAventura: number): Observable<FinalAutor[]> {
    return this.http.get<FinalAutor[]>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Final`);
  }

  crearFinal(idAventura: number, dto: GuardarFinalRequest): Observable<FinalAutor> {
    return this.http.post<FinalAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Final`, dto);
  }

  actualizarFinal(idFinal: number, dto: GuardarFinalRequest): Observable<FinalAutor> {
    return this.http.put<FinalAutor>(`${this.baseUrl}/Autor/Final/${idFinal}`, dto);
  }

  eliminarFinal(idFinal: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Final/${idFinal}`);
  }

  getCaracteristicas(idAventura: number): Observable<CaracteristicaAutor[]> {
    return this.http.get<CaracteristicaAutor[]>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Caracteristica`);
  }

  crearCaracteristica(idAventura: number, dto: GuardarCaracteristicaRequest): Observable<CaracteristicaAutor> {
    return this.http.post<CaracteristicaAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Caracteristica`, dto);
  }

  actualizarCaracteristica(idCaracteristica: number, dto: GuardarCaracteristicaRequest): Observable<CaracteristicaAutor> {
    return this.http.put<CaracteristicaAutor>(`${this.baseUrl}/Autor/Caracteristica/${idCaracteristica}`, dto);
  }

  eliminarCaracteristica(idCaracteristica: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/Autor/Caracteristica/${idCaracteristica}`);
  }

  getTiposCaracteristica(): Observable<CatTipoCaracteristicaAutor[]> {
    return this.http.get<CatTipoCaracteristicaAutor[]>(`${this.baseUrl}/Autor/CatTipoCaracteristica`);
  }

  getEventos(idAventura: number): Observable<EventoAutor[]> {
    return this.http.get<EventoAutor[]>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Evento`);
  }

  crearEvento(idAventura: number, dto: GuardarEventoRequest): Observable<EventoAutor> {
    return this.http.post<EventoAutor>(`${this.baseUrl}/Autor/Aventura/${idAventura}/Evento`, dto);
  }
}
