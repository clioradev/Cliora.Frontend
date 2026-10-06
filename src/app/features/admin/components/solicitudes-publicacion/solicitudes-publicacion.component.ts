import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import {
  GuardarPrecioRequest,
  PARAMETRO_PRECIO_AVENTURA_INTERACTIVA,
  ParametroAdmin,
  SolicitudPublicacionAdmin,
} from '../../models/admin.model';
import { escribirImporte, leerImporte } from '../../utils/importe';

@Component({
  selector: 'app-solicitudes-publicacion',
  imports: [DatePipe],
  templateUrl: './solicitudes-publicacion.component.html',
  styleUrl: './solicitudes-publicacion.component.scss',
})
export class SolicitudesPublicacionComponent {
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  private readonly solicitudesResource = rxResource({
    stream: () => this.adminService.obtenerSolicitudesPublicacion(),
    defaultValue: [] as SolicitudPublicacionAdmin[],
  });
  protected readonly solicitudes = this.solicitudesResource.value;
  protected readonly cargando = this.solicitudesResource.isLoading;

  protected readonly filaEnCurso = signal<number | null>(null);

  private readonly previsualizarAction = asyncAction(
    (solicitud: SolicitudPublicacionAdmin) => this.adminService.previsualizarVersion(solicitud.idVersionAventura),
    {
      onSuccess: (respuesta, solicitud) =>
        void this.router.navigate(['/partida', respuesta.idNodoActual], {
          queryParams: { idVersionAventura: solicitud.idVersionAventura, admin: true, preview: true },
        }),
      onError: () => this.filaEnCurso.set(null),
      defaultErrorMessage: 'No se ha podido previsualizar la aventura.',
    },
  );
  protected readonly previsualizando = this.previsualizarAction.loading;
  protected readonly errorPrevisualizar = this.previsualizarAction.error;

  protected previsualizar(solicitud: SolicitudPublicacionAdmin): void {
    this.filaEnCurso.set(solicitud.idVersionAventura);
    this.previsualizarAction.run(solicitud);
  }

  private readonly parametrosResource = rxResource({
    stream: () => this.adminService.obtenerParametros(),
    defaultValue: [] as ParametroAdmin[],
  });
  private readonly precioPorDefecto = computed(
    () => this.parametrosResource.value().find((p) => p.codigo === PARAMETRO_PRECIO_AVENTURA_INTERACTIVA)?.valor ?? null,
  );

  protected readonly escribirImporte = escribirImporte;
  protected readonly errorPrecio = signal<{ idVersionAventura: number; mensaje: string } | null>(null);

  // El precio que ya tenga la aventura; si no tiene, el precio por defecto para las interactivas que
  // no son la primera de su campaña. Los libros y las primeras se proponen gratis.
  protected precioPropuesto(solicitud: SolicitudPublicacionAdmin): string {
    if (solicitud.precio !== null) {
      return escribirImporte(solicitud.precio);
    }
    if (solicitud.esPrimera || solicitud.esLibro) {
      return '';
    }
    return escribirImporte(this.precioPorDefecto());
  }

  private readonly publicarAction = asyncAction(
    (solicitud: SolicitudPublicacionAdmin, precio: GuardarPrecioRequest) =>
      this.adminService.publicarVersion(solicitud.idVersionAventura, precio),
    {
      onSuccess: () => {
        this.filaEnCurso.set(null);
        this.solicitudesResource.reload();
      },
      onError: () => this.filaEnCurso.set(null),
      defaultErrorMessage: 'No se ha podido publicar la aventura.',
    },
  );
  protected readonly publicando = this.publicarAction.loading;
  protected readonly errorPublicar = this.publicarAction.error;

  protected publicar(solicitud: SolicitudPublicacionAdmin, textoPrecio: string, textoDescuento: string): void {
    const precio = leerImporte(textoPrecio);
    const descuento = leerImporte(textoDescuento);
    if (precio === undefined || descuento === undefined) {
      this.errorPrecio.set({ idVersionAventura: solicitud.idVersionAventura, mensaje: 'Escribe importes como 1,99.' });
      return;
    }
    if ((descuento ?? 0) > (precio ?? 0)) {
      this.errorPrecio.set({
        idVersionAventura: solicitud.idVersionAventura,
        mensaje: 'El descuento no puede superar el precio.',
      });
      return;
    }

    this.errorPrecio.set(null);
    this.filaEnCurso.set(solicitud.idVersionAventura);
    this.publicarAction.run(solicitud, { precio, descuento: descuento ?? 0 });
  }

  private readonly rechazarAction = asyncAction(
    (solicitud: SolicitudPublicacionAdmin) => this.adminService.rechazarVersion(solicitud.idVersionAventura),
    {
      onSuccess: () => {
        this.filaEnCurso.set(null);
        this.solicitudesResource.reload();
      },
      onError: () => this.filaEnCurso.set(null),
      defaultErrorMessage: 'No se ha podido rechazar la solicitud.',
    },
  );
  protected readonly rechazando = this.rechazarAction.loading;
  protected readonly errorRechazar = this.rechazarAction.error;

  protected rechazar(solicitud: SolicitudPublicacionAdmin): void {
    this.filaEnCurso.set(solicitud.idVersionAventura);
    this.rechazarAction.run(solicitud);
  }

  protected accionEnCurso(solicitud: SolicitudPublicacionAdmin): boolean {
    return (
      this.filaEnCurso() === solicitud.idVersionAventura &&
      (this.previsualizando() || this.publicando() || this.rechazando())
    );
  }
}
