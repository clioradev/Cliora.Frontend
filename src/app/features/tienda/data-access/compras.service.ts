import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { CompraUsuario, DevolucionRealizada } from '../models/tienda.model';

@Injectable({ providedIn: 'root' })
export class ComprasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  obtenerCompras(): Observable<CompraUsuario[]> {
    return this.http.get<CompraUsuario[]>(`${this.baseUrl}/Tienda/Compras`);
  }

  /** Si la línea es de una campaña comprada entera, el servidor devuelve todo el pack. */
  devolver(idCompraAventura: number): Observable<DevolucionRealizada> {
    return this.http.post<DevolucionRealizada>(`${this.baseUrl}/Tienda/Compras/${idCompraAventura}/Devolver`, {});
  }
}
