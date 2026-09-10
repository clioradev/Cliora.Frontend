import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import { SolicitudPublicacionAdmin } from '../../models/admin.model';

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

  private readonly publicarAction = asyncAction(
    (solicitud: SolicitudPublicacionAdmin) => this.adminService.publicarVersion(solicitud.idVersionAventura),
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

  protected publicar(solicitud: SolicitudPublicacionAdmin): void {
    this.filaEnCurso.set(solicitud.idVersionAventura);
    this.publicarAction.run(solicitud);
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
