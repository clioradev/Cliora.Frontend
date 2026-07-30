import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { Universo } from '../models/universo.model';

@Injectable({ providedIn: 'root' })
export class UniversoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  getUniversos(): Observable<Universo[]> {
    return this.http.get<Universo[]>(`${this.baseUrl}/Universo`);
  }
}
