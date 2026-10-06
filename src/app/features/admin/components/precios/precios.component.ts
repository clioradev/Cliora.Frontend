import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { AdminService } from '../../data-access/admin.service';
import {
  GuardarPrecioRequest,
  PARAMETRO_PRECIO_AVENTURA_INTERACTIVA,
  ParametroAdmin,
  PrecioAventuraAdmin,
} from '../../models/admin.model';
import { escribirImporte, leerImporte } from '../../utils/importe';

interface GrupoCampana {
  idCampana: number;
  titulo: string;
  aventuras: PrecioAventuraAdmin[];
}

interface GrupoUniverso {
  idUniverso: number;
  titulo: string;
  campanas: GrupoCampana[];
}

@Component({
  selector: 'app-precios',
  imports: [PrecioPipe],
  templateUrl: './precios.component.html',
  styleUrl: './precios.component.scss',
})
export class PreciosComponent {
  private readonly adminService = inject(AdminService);

  private readonly preciosResource = rxResource({
    stream: () => this.adminService.obtenerPrecios(),
    defaultValue: [] as PrecioAventuraAdmin[],
  });
  protected readonly cargando = this.preciosResource.isLoading;

  private readonly parametrosResource = rxResource({
    stream: () => this.adminService.obtenerParametros(),
    defaultValue: [] as ParametroAdmin[],
  });
  protected readonly precioPorDefecto = computed(
    () => this.parametrosResource.value().find((p) => p.codigo === PARAMETRO_PRECIO_AVENTURA_INTERACTIVA)?.valor ?? null,
  );

  protected readonly universos = computed<GrupoUniverso[]>(() => {
    const universos: GrupoUniverso[] = [];
    for (const aventura of this.preciosResource.value()) {
      let universo = universos.find((u) => u.idUniverso === aventura.idUniverso);
      if (!universo) {
        universo = { idUniverso: aventura.idUniverso, titulo: aventura.tituloUniverso, campanas: [] };
        universos.push(universo);
      }
      let campana = universo.campanas.find((c) => c.idCampana === aventura.idCampana);
      if (!campana) {
        campana = { idCampana: aventura.idCampana, titulo: aventura.tituloCampana, aventuras: [] };
        universo.campanas.push(campana);
      }
      campana.aventuras.push(aventura);
    }
    return universos;
  });

  protected readonly filaEnCurso = signal<number | null>(null);
  protected readonly filaGuardada = signal<number | null>(null);
  protected readonly errorValidacion = signal<{ idAventura: number; mensaje: string } | null>(null);

  private readonly guardarAction = asyncAction(
    (idAventura: number, precio: GuardarPrecioRequest) => this.adminService.guardarPrecio(idAventura, precio),
    {
      onSuccess: (_, idAventura) => {
        this.filaEnCurso.set(null);
        this.filaGuardada.set(idAventura);
        this.preciosResource.reload();
      },
      onError: () => this.filaEnCurso.set(null),
      defaultErrorMessage: 'No se ha podido guardar el precio.',
    },
  );
  protected readonly errorGuardar = this.guardarAction.error;
  protected readonly guardando = this.guardarAction.loading;

  protected readonly escribirImporte = escribirImporte;

  protected precioFinal(aventura: PrecioAventuraAdmin): number | null {
    if (aventura.precio === null || aventura.precio <= 0) {
      return null;
    }
    const final = Math.max(0, aventura.precio - aventura.descuento);
    return final === 0 ? null : final;
  }

  protected placeholderPrecio(aventura: PrecioAventuraAdmin): string {
    const porDefecto = this.precioPorDefecto();
    return !aventura.esLibro && porDefecto !== null ? `Gratis (por defecto ${escribirImporte(porDefecto)})` : 'Gratis';
  }

  protected guardar(aventura: PrecioAventuraAdmin, textoPrecio: string, textoDescuento: string): void {
    const precio = leerImporte(textoPrecio);
    const descuento = leerImporte(textoDescuento);
    if (precio === undefined || descuento === undefined) {
      this.errorValidacion.set({ idAventura: aventura.idAventura, mensaje: 'Escribe importes como 1,99.' });
      return;
    }
    if ((descuento ?? 0) > (precio ?? 0)) {
      this.errorValidacion.set({ idAventura: aventura.idAventura, mensaje: 'El descuento no puede superar el precio.' });
      return;
    }

    this.errorValidacion.set(null);
    this.filaGuardada.set(null);
    this.filaEnCurso.set(aventura.idAventura);
    this.guardarAction.run(aventura.idAventura, { precio, descuento: descuento ?? 0 });
  }
}
