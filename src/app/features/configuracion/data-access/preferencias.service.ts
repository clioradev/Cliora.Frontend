import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { Preferencias } from '../models/preferencias.model';

@Injectable({ providedIn: 'root' })
export class PreferenciasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerPreferencias(): Observable<Preferencias> {
    return this.http.get<Preferencias>(`${this.baseUrl}/Permiso/Preferencias`);
  }

  actualizarPreferencias(dto: Preferencias): Observable<Preferencias> {
    return this.http.put<Preferencias>(`${this.baseUrl}/Permiso/Preferencias`, dto);
  }
}
