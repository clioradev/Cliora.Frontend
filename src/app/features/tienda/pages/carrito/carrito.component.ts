import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { CarritoService } from '../../data-access/carrito.service';
import { CompraRealizada, ElementoRechazado, LineaPresupuesto } from '../../models/tienda.model';

interface GrupoCampana {
  idCampana: number;
  tituloCampana: string;
  lineas: LineaPresupuesto[];
  total: number;
  totalSinDescuento: number;
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

  protected readonly aceptaCondiciones = signal(false);
  protected readonly compraRealizada = signal<CompraRealizada | null>(null);

  private readonly comprarAction = asyncAction(
    () => this.carritoService.comprarSimulado(this.carritoService.carrito(), this.aceptaCondiciones()),
    {
      onSuccess: (compra) => {
        this.compraRealizada.set(compra);
        this.aceptaCondiciones.set(false);
        this.carritoService.vaciar();
      },
      defaultErrorMessage: 'No se ha podido completar la compra.',
    },
  );
  protected readonly comprando = this.comprarAction.loading;
  protected readonly errorComprar = this.comprarAction.error;

  protected comprar(): void {
    this.comprarAction.run();
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
        totalSinDescuento: 0,
      };
      grupo.lineas.push(linea);
      grupo.total += linea.importe;
      grupo.totalSinDescuento += linea.importe + linea.descuentoCampana;
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
