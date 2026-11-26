import { HttpClient, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import {
  ContratoAutor,
  DuracionAventura,
  GuardarContratoRequest,
  LecturaAdmin,
  PagoAutor,
  PanelIngresosAutor,
  Periodo,
  PropuestaDuracion,
  RegistrarPagoRequest,
  ResumenEconomico,
} from '../models/economia.model';

@Injectable({ providedIn: 'root' })
export class EconomiaService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  // --- Administración

  obtenerResumen(anio: number, mes: number): Observable<ResumenEconomico> {
    return this.http.get<ResumenEconomico>(`${this.baseUrl}/Economia/Resumen`, { params: { anio, mes } });
  }

  cerrarMes(anio: number, mes: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Economia/Cerrar`, { anio, mes });
  }

  obtenerPeriodos(): Observable<Periodo[]> {
    return this.http.get<Periodo[]>(`${this.baseUrl}/Economia/Periodos`);
  }

  obtenerAutores(): Observable<ContratoAutor[]> {
    return this.http.get<ContratoAutor[]>(`${this.baseUrl}/Economia/Autores`);
  }

  guardarContrato(idAutor: number, request: GuardarContratoRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Economia/Autores/${idAutor}/Contrato`, request);
  }

  registrarPago(idAutor: number, request: RegistrarPagoRequest): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Economia/Autores/${idAutor}/Pagos`, request);
  }

  obtenerPagos(): Observable<PagoAutor[]> {
    return this.http.get<PagoAutor[]>(`${this.baseUrl}/Economia/Pagos`);
  }

  obtenerLecturas(anio: number, mes: number, soloSospechosas: boolean): Observable<LecturaAdmin[]> {
    return this.http.get<LecturaAdmin[]>(`${this.baseUrl}/Economia/Lecturas`, { params: { anio, mes, soloSospechosas } });
  }

  invalidarLectura(idLectura: number, motivo: string | null): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Economia/Lecturas/${idLectura}/Invalidar`, { motivo });
  }

  revalidarLectura(idLectura: number): Observable<void> {
    return this.http.post<void>(`${this.baseUrl}/Economia/Lecturas/${idLectura}/Revalidar`, {});
  }

  obtenerDuraciones(): Observable<DuracionAventura[]> {
    return this.http.get<DuracionAventura[]>(`${this.baseUrl}/Economia/Duraciones`);
  }

  proponerDuracion(idAventura: number): Observable<PropuestaDuracion> {
    return this.http.post<PropuestaDuracion>(`${this.baseUrl}/Economia/Duraciones/${idAventura}/Proponer`, {});
  }

  guardarDuracion(idAventura: number, minutos: number | null): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/Economia/Duraciones/${idAventura}`, { minutos });
  }

  exportar(tipo: 'Movimientos' | 'Liquidacion', anio: number, mes: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/Economia/Exportar/${tipo}`, {
      params: { anio, mes },
      responseType: 'blob',
      observe: 'response',
    });
  }

  // --- Autor

  obtenerMisIngresos(): Observable<PanelIngresosAutor> {
    return this.http.get<PanelIngresosAutor>(`${this.baseUrl}/Autor/Ingresos`);
  }
}
