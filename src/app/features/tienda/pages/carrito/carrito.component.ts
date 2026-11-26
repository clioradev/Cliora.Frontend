import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { rxResource, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { timer } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { CarritoService } from '../../data-access/carrito.service';
import { CompraRealizada, ElementoRechazado, LineaPresupuesto } from '../../models/tienda.model';

interface GrupoCampana {
  idCampana: number;
  tituloCampana: string;
  lineas: LineaPresupuesto[];
  total: number;
  /** Lo que se ahorra por el descuento de campaña (sin contar las que salen gratis). */
  ahorroCampana: number;
}

@Component({
  selector: 'app-carrito',
  imports: [RouterLink, PrecioPipe],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.scss',
})
export class CarritoComponent {
  protected readonly carritoService = inject(CarritoService);

  private readonly presupuestoResource = rxResource({
    params: () => (this.carritoService.cantidad() > 0 ? this.carritoService.carrito() : undefined),
    stream: ({ params }) => this.carritoService.obtenerPresupuesto(params),
  });
  protected readonly presupuesto = this.presupuestoResource.value;
  protected readonly cargando = this.presupuestoResource.isLoading;
  protected readonly error = computed(() => this.presupuestoResource.error() !== undefined);

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly aceptaCondiciones = signal(false);
  protected readonly compraRealizada = signal<CompraRealizada | null>(null);
  /** Saliendo hacia la página de pago de Stripe. */
  protected readonly redirigiendo = signal(false);
  /** Qué pasa al volver de la página de pago (?pago=ok|cancelado&compra=N). */
  protected readonly vuelta = signal<'confirmando' | 'esperando' | 'cancelado' | 'fallida' | null>(null);

  private readonly comprarAction = asyncAction(
    () => this.carritoService.comprar(this.carritoService.carrito(), this.aceptaCondiciones()),
    {
      onSuccess: (compra) => {
        if (compra.urlPago) {
          // El carrito se conserva hasta que el pago se confirme a la vuelta.
          this.redirigiendo.set(true);
          window.location.assign(compra.urlPago);
          return;
        }
        this.completar(compra);
      },
      defaultErrorMessage: 'No se ha podido completar la compra.',
    },
  );
  protected readonly comprando = computed(() => this.comprarAction.loading() || this.redirigiendo());
  protected readonly errorComprar = this.comprarAction.error;

  constructor() {
    const parametros = this.route.snapshot.queryParamMap;
    const idCompra = Number(parametros.get('compra'));
    const pago = parametros.get('pago');
    if (!Number.isInteger(idCompra) || idCompra <= 0 || (pago !== 'ok' && pago !== 'cancelado')) {
      return;
    }
    // Se quitan los parámetros para que recargar la página no repita la comprobación.
    void this.router.navigate([], { relativeTo: this.route, queryParams: {}, replaceUrl: true });
    if (pago === 'ok') {
      this.vuelta.set('confirmando');
      this.confirmarVuelta(idCompra, 0);
    } else {
      this.vuelta.set('cancelado');
      this.carritoService
        .cancelarPago(idCompra)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (estado) => {
            // Pudo pagar justo antes de volver: entonces la compra ya está hecha.
            if (estado.estado === 'Pagada') {
              this.completar({ idCompra, total: estado.total, urlPago: null });
            }
          },
          error: () => undefined,
        });
    }
  }

  protected comprar(): void {
    this.comprarAction.run();
  }

  /** El aviso de Stripe puede tardar unos segundos: se pregunta varias veces antes de rendirse. */
  private confirmarVuelta(idCompra: number, intento: number): void {
    this.carritoService
      .confirmarPago(idCompra)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (estado) => {
          if (estado.estado === 'Pagada') {
            this.completar({ idCompra, total: estado.total, urlPago: null });
          } else if (estado.estado === 'Pendiente' && intento < 10) {
            timer(2000)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => this.confirmarVuelta(idCompra, intento + 1));
          } else {
            this.vuelta.set(estado.estado === 'Pendiente' ? 'esperando' : 'fallida');
          }
        },
        error: () => this.vuelta.set('esperando'),
      });
  }

  private completar(compra: CompraRealizada): void {
    this.vuelta.set(null);
    this.compraRealizada.set(compra);
    this.aceptaCondiciones.set(false);
    this.carritoService.vaciar();
  }

  protected readonly campanas = computed<GrupoCampana[]>(() => {
    const grupos = new Map<number, GrupoCampana>();
    for (const linea of this.presupuesto()?.lineas ?? []) {
      if (!linea.porCampana) {
        continue;
      }
      const grupo = grupos.get(linea.idCampana) ?? {
        idCampana: linea.idCampana,
        tituloCampana: linea.tituloCampana,
        lineas: [],
        total: 0,
        ahorroCampana: 0,
      };
      grupo.lineas.push(linea);
      grupo.total += linea.importe;
      if (!linea.esGratuitaPorCredito) {
        grupo.ahorroCampana += linea.descuentoCampana;
      }
      grupos.set(linea.idCampana, grupo);
    }
    return [...grupos.values()];
  });

  protected readonly sueltas = computed(() => (this.presupuesto()?.lineas ?? []).filter((l) => !l.porCampana));

  protected quitarRechazado(rechazado: ElementoRechazado): void {
    if (rechazado.idCampana !== null) {
      this.carritoService.quitarCampana(rechazado.idCampana);
    }
    if (rechazado.idAventura !== null) {
      this.carritoService.quitarAventura(rechazado.idAventura);
    }
  }

  protected onAceptaCondiciones(evento: Event): void {
    this.aceptaCondiciones.set((evento.target as HTMLInputElement).checked);
  }
}
