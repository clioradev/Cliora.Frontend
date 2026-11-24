import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import {
  ConfirmarNuevaVersion,
  GuardarPrecioRequest,
  PARAMETRO_PRECIO_AVENTURA_INTERACTIVA,
  PARAMETRO_PRECIO_LIBRO,
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
  private readonly precioPorDefectoInteractiva = computed(
    () => this.parametrosResource.value().find((p) => p.codigo === PARAMETRO_PRECIO_AVENTURA_INTERACTIVA)?.valor ?? null,
  );
  private readonly precioPorDefectoLibro = computed(
    () => this.parametrosResource.value().find((p) => p.codigo === PARAMETRO_PRECIO_LIBRO)?.valor ?? null,
  );

  protected readonly escribirImporte = escribirImporte;
  protected readonly errorPrecio = signal<{ idVersionAventura: number; mensaje: string } | null>(null);

  // El precio que ya tenga la aventura; si no tiene, el precio por defecto de su tipo (interactiva o
  // libro) salvo que sea la primera de su campaña, que se propone gratis.
  protected precioPropuesto(solicitud: SolicitudPublicacionAdmin): string {
    if (solicitud.precio !== null) {
      return escribirImporte(solicitud.precio);
    }
    if (solicitud.esPrimera) {
      return '';
    }
    return escribirImporte(solicitud.esLibro ? this.precioPorDefectoLibro() : this.precioPorDefectoInteractiva());
  }

  /** Solicitud cuya publicación cambia los eventos: espera a que se confirme la versión nueva. */
  protected readonly confirmacionPendiente = signal<{
    solicitud: SolicitudPublicacionAdmin;
    precio: GuardarPrecioRequest;
    motivos: string[];
  } | null>(null);
  protected readonly mensajePublicada = signal<string | null>(null);

  private readonly publicarAction = asyncAction(
    (solicitud: SolicitudPublicacionAdmin, precio: GuardarPrecioRequest, nuevaVersion: boolean) =>
      this.adminService.publicarVersion(solicitud.idVersionAventura, precio, nuevaVersion),
    {
      onSuccess: (respuesta, solicitud) => {
        this.filaEnCurso.set(null);
        this.confirmacionPendiente.set(null);
        this.mensajePublicada.set(
          respuesta.fusionada
            ? `«${solicitud.tituloAventura}» actualizada sin cambiar de versión (v${respuesta.version}): ` +
                'quien la está leyendo sigue donde estaba.'
            : `«${solicitud.tituloAventura}» publicada como v${respuesta.version}.`,
        );
        this.solicitudesResource.reload();
      },
      onError: (err, solicitud, precio) => {
        this.filaEnCurso.set(null);
        const cuerpo = esConfirmacionNuevaVersion(err);
        if (cuerpo) {
          this.confirmacionPendiente.set({ solicitud, precio, motivos: cuerpo.motivos });
        }
      },
      // El 409 no es un error: se pide confirmación en la propia fila.
      resolveErrorMessage: (err) => {
        if (esConfirmacionNuevaVersion(err)) {
          return '';
        }
        const cuerpo = (err as { error?: unknown } | null)?.error;
        return Array.isArray(cuerpo) && cuerpo.every((m) => typeof m === 'string')
          ? cuerpo.join(' ')
          : 'No se ha podido publicar la aventura.';
      },
    },
  );
  protected readonly publicando = this.publicarAction.loading;
  protected readonly errorPublicar = this.publicarAction.error;

  protected publicar(solicitud: SolicitudPublicacionAdmin, textoPrecio: string, textoDescuento: string): void {
    this.mensajePublicada.set(null);
    this.confirmacionPendiente.set(null);

    // Infantil y juvenil no se venden: se guardan a 0 € (el back lo fuerza igualmente).
    if (solicitud.esParaHijos) {
      this.errorPrecio.set(null);
      this.filaEnCurso.set(solicitud.idVersionAventura);
      this.publicarAction.run(solicitud, { precio: 0, descuento: 0 }, false);
      return;
    }

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
    this.publicarAction.run(solicitud, { precio, descuento: descuento ?? 0 }, false);
  }

  protected confirmarNuevaVersion(): void {
    const pendiente = this.confirmacionPendiente();
    if (!pendiente) {
      return;
    }
    this.filaEnCurso.set(pendiente.solicitud.idVersionAventura);
    this.publicarAction.run(pendiente.solicitud, pendiente.precio, true);
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

function esConfirmacionNuevaVersion(err: unknown): ConfirmarNuevaVersion | null {
  if (!(err instanceof HttpErrorResponse) || err.status !== 409) {
    return null;
  }
  const cuerpo = err.error as Partial<ConfirmarNuevaVersion> | null;
  return cuerpo?.requiereConfirmacion && Array.isArray(cuerpo.motivos) ? (cuerpo as ConfirmarNuevaVersion) : null;
}
