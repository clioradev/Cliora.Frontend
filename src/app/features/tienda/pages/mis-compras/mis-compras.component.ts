import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { ComprasService } from '../../data-access/compras.service';
import { CompraUsuario, DevolucionRealizada } from '../../models/tienda.model';

/** Lo que se devuelve de una vez: una aventura suelta o una campaña comprada entera. */
interface ElementoCompra {
  clave: string;
  esPack: boolean;
  titulo: string;
  subtitulo: string;
  fechaCompra: string;
  lineas: CompraUsuario[];
  importe: number;
  aventurasGratis: number;
  devuelta: boolean;
  fechaDevolucion: string | null;
  puedeDevolverse: boolean;
  motivoNoDevolvible: string | null;
}

@Component({
  selector: 'app-mis-compras',
  imports: [DatePipe, ModalComponent, PrecioPipe],
  templateUrl: './mis-compras.component.html',
  styleUrl: './mis-compras.component.scss',
})
export class MisComprasComponent {
  private readonly comprasService = inject(ComprasService);

  private readonly comprasResource = rxResource({
    stream: () => this.comprasService.obtenerCompras(),
    defaultValue: [] as CompraUsuario[],
  });
  protected readonly cargando = this.comprasResource.isLoading;
  protected readonly errorCarga = computed(() => this.comprasResource.error() !== undefined);

  protected readonly elementos = computed(() => this.agrupar(this.comprasResource.value()));

  protected readonly aDevolver = signal<ElementoCompra | null>(null);
  protected readonly devuelto = signal<{ titulo: string; resultado: DevolucionRealizada } | null>(null);

  private readonly devolverAction = asyncAction(
    (elemento: ElementoCompra) => this.comprasService.devolver(elemento.lineas[0].idCompraAventura),
    {
      onSuccess: (resultado, elemento) => {
        this.devuelto.set({ titulo: elemento.titulo, resultado });
        this.aDevolver.set(null);
        this.comprasResource.reload();
      },
      defaultErrorMessage: 'No se ha podido hacer la devolución.',
    },
  );
  protected readonly devolviendo = this.devolverAction.loading;
  protected readonly errorDevolver = this.devolverAction.error;

  protected pedirDevolucion(elemento: ElementoCompra): void {
    this.devolverAction.reset();
    this.devuelto.set(null);
    this.aDevolver.set(elemento);
  }

  protected cerrarModal(): void {
    if (!this.devolviendo()) {
      this.aDevolver.set(null);
    }
  }

  protected confirmarDevolucion(): void {
    const elemento = this.aDevolver();
    if (elemento) {
      this.devolverAction.run(elemento);
    }
  }

  protected textoAventurasGratis(cantidad: number): string {
    return cantidad === 1 ? '1 aventura gratis' : `${cantidad} aventuras gratis`;
  }

  // Las líneas de una campaña comprada entera van juntas: se devuelven a la vez.
  private agrupar(compras: CompraUsuario[]): ElementoCompra[] {
    const grupos = new Map<string, CompraUsuario[]>();
    for (const compra of compras) {
      const clave =
        compra.idCampanaPack === null ? `l${compra.idCompraAventura}` : `p${compra.idCompra}-${compra.idCampanaPack}`;
      grupos.set(clave, [...(grupos.get(clave) ?? []), compra]);
    }

    return [...grupos.entries()].map(([clave, lineas]) => {
      const primera = lineas[0];
      const esPack = primera.idCampanaPack !== null;
      return {
        clave,
        esPack,
        titulo: esPack ? `la campaña «${primera.tituloCampana}»` : `«${primera.tituloAventura}»`,
        subtitulo: esPack ? primera.tituloUniverso : `${primera.tituloUniverso} · ${primera.tituloCampana}`,
        fechaCompra: primera.fechaCompra,
        lineas,
        importe: lineas.filter((l) => !l.esGratuitaPorCredito).reduce((total, l) => total + l.importe, 0),
        aventurasGratis: lineas.filter((l) => l.esGratuitaPorCredito).length,
        devuelta: primera.estado === 'Devuelta',
        fechaDevolucion: primera.fechaDevolucion,
        puedeDevolverse: primera.puedeDevolverse,
        motivoNoDevolvible: primera.motivoNoDevolvible,
      };
    });
  }
}
