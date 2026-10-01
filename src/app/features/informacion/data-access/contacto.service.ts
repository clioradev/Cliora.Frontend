import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class ContactoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  solicitarInformacionAutor(mensaje: string): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Contacto/SolicitudAutor`, { mensaje });
  }
}
