import { HttpClient } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../../../core/api/api-base-url.token';
import { AuthService } from '../../../core/auth/auth.service';
import { Carrito, CompraRealizada, Presupuesto } from '../models/tienda.model';

const CLAVE_ALMACENAMIENTO = 'cliora.carrito';

const CARRITO_VACIO: Carrito = { idsAventura: [], idsCampana: [] };

/**
 * Carrito guardado en el dispositivo (localStorage; en las apps de Capacitor también persiste).
 * Se guarda por usuario para que dos cuentas en el mismo navegador no compartan carrito.
 */
@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly authService = inject(AuthService);

  private readonly _carrito = signal<Carrito>(CARRITO_VACIO);
  readonly carrito = this._carrito.asReadonly();
  readonly cantidad = computed(() => this._carrito().idsAventura.length + this._carrito().idsCampana.length);

  /** Último aviso ("¡Aventura añadida!") para la burbuja del menú inferior; el id distingue avisos repetidos. */
  private readonly _aviso = signal<{ id: number; texto: string } | null>(null);
  readonly aviso = this._aviso.asReadonly();

  private readonly clave = computed(() => {
    const idUsuario = this.authService.currentUser()?.idUsuario;
    return idUsuario === undefined ? null : `${CLAVE_ALMACENAMIENTO}.${idUsuario}`;
  });

  constructor() {
    // Al cambiar de usuario (login, logout) se carga su carrito.
    effect(() => this._carrito.set(this.leer(this.clave())));
  }

  contieneAventura(idAventura: number): boolean {
    return this._carrito().idsAventura.includes(idAventura);
  }

  contieneCampana(idCampana: number): boolean {
    return this._carrito().idsCampana.includes(idCampana);
  }

  anadirAventura(idAventura: number): void {
    if (!this.contieneAventura(idAventura)) {
      this.guardar({ ...this._carrito(), idsAventura: [...this._carrito().idsAventura, idAventura] });
    }
  }

  anadirCampana(idCampana: number): void {
    if (!this.contieneCampana(idCampana)) {
      this.guardar({ ...this._carrito(), idsCampana: [...this._carrito().idsCampana, idCampana] });
    }
  }

  avisar(texto: string): void {
    this._aviso.set({ id: Date.now(), texto });
  }

  quitarAventura(idAventura: number): void {
    this.guardar({ ...this._carrito(), idsAventura: this._carrito().idsAventura.filter((id) => id !== idAventura) });
  }

  quitarCampana(idCampana: number): void {
    this.guardar({ ...this._carrito(), idsCampana: this._carrito().idsCampana.filter((id) => id !== idCampana) });
  }

  vaciar(): void {
    this.guardar(CARRITO_VACIO);
  }

  obtenerPresupuesto(carrito: Carrito): Observable<Presupuesto> {
    return this.http.post<Presupuesto>(`${this.baseUrl}/Tienda/Presupuesto`, carrito);
  }

  /** Pago ficticio (solo en entornos de prueba): el servidor registra la compra sin cobrar. */
  comprarSimulado(carrito: Carrito, aceptaCondiciones: boolean): Observable<CompraRealizada> {
    return this.http.post<CompraRealizada>(`${this.baseUrl}/Tienda/ComprarSimulado`, { ...carrito, aceptaCondiciones });
  }

  private guardar(carrito: Carrito): void {
    this._carrito.set(carrito);
    const clave = this.clave();
    if (clave === null) {
      return;
    }
    try {
      localStorage.setItem(clave, JSON.stringify(carrito));
    } catch {
      // Sin almacenamiento (modo privado, bloqueado...): el carrito vive solo en memoria.
    }
  }

  private leer(clave: string | null): Carrito {
    if (clave === null) {
      return CARRITO_VACIO;
    }
    try {
      const guardado = JSON.parse(localStorage.getItem(clave) ?? 'null') as Partial<Carrito> | null;
      return {
        idsAventura: Array.isArray(guardado?.idsAventura) ? guardado.idsAventura.filter(Number.isInteger) : [],
        idsCampana: Array.isArray(guardado?.idsCampana) ? guardado.idsCampana.filter(Number.isInteger) : [],
      };
    } catch {
      return CARRITO_VACIO;
    }
  }
}
