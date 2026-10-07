import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AdminService } from '../../../admin/data-access/admin.service';
import { AutorService } from '../../../autor/data-access/autor.service';
import { FichaPersonajeModalComponent } from '../../components/ficha-personaje-modal/ficha-personaje-modal.component';
import { InformarErrorModalComponent } from '../../components/informar-error-modal/informar-error-modal.component';
import { ResultadoTiradaModalComponent } from '../../components/resultado-tirada-modal/resultado-tirada-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { Opcion, TiradaResultado } from '../../models/partida.model';

@Component({
  selector: 'app-partida',
  imports: [ResultadoTiradaModalComponent, FichaPersonajeModalComponent, InformarErrorModalComponent, IconoComponent],
  templateUrl: './partida.component.html',
  styleUrl: './partida.component.scss',
})
export class PartidaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);
  private readonly autorService = inject(AutorService);
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly idAventura = computed(() => {
    const idAventuraParam = this.queryParamMap().get('idAventura');
    return idAventuraParam ? Number(idAventuraParam) : null;
  });

  protected readonly idVersionAventura = computed(() => {
    const idVersionParam = this.queryParamMap().get('idVersionAventura');
    return idVersionParam ? Number(idVersionParam) : null;
  });

  protected readonly esAdmin = computed(() => this.queryParamMap().get('admin') === 'true');

  protected readonly preview = computed(() => this.queryParamMap().get('preview') === 'true');

  private readonly nodoResource = rxResource({
    params: () => Number(this.paramMap().get('idNodo')),
    stream: ({ params }) => this.partidaService.getNodo(params),
  });
  protected readonly nodo = this.nodoResource.value;
  protected readonly loading = this.nodoResource.isLoading;
  protected readonly error = computed(() => this.nodoResource.error() !== undefined);

  protected readonly resultadoTirada = signal<TiradaResultado | null>(null);
  private destinoPendiente: { idNodo: number | null; idFinal: number | null } | null = null;

  protected readonly personajeAbierto = signal(false);

  // «Informar de error», solo para revisores: el botón abre un modal con comentario opcional y el
  // servidor guarda el nodo, el anterior y una captura de características y eventos. Volver a
  // informar en el mismo nodo solo actualiza la alerta.
  protected readonly esRevisor = computed(() => this.authService.tieneRol('Revisor'));
  protected readonly informarErrorAbierto = signal(false);
  protected readonly alertasEnNodo = signal<number | null>(null);

  protected onErrorInformado(numeroAlertas: number): void {
    this.informarErrorAbierto.set(false);
    this.alertasEnNodo.set(numeroAlertas);
  }

  // Imágenes lo bastante pequeñas (< 60% del ancho del bloque de contenido) como para que el texto
  // fluya a su lado en vez de partir el nodo en bloques separados - ver onImagenCargada().
  protected readonly imagenesFlotantes = signal(new Set<number>());

  constructor() {
    effect(() => {
      this.nodo();
      this.imagenesFlotantes.set(new Set());
      this.alertasEnNodo.set(null);
    });
  }

  protected onImagenCargada(event: Event, idContenidoNodo: number): void {
    const img = event.target as HTMLImageElement;
    const anchoContenedor = img.closest('.nodo__contenidos')?.clientWidth ?? img.parentElement?.clientWidth ?? 0;

    if (anchoContenedor > 0 && img.naturalWidth > 0 && img.naturalWidth < anchoContenedor * 0.6) {
      this.imagenesFlotantes.update((actual) => new Set(actual).add(idContenidoNodo));
    }
  }

  private readonly elegirAction = asyncAction(
    (opcion: Opcion) => this.partidaService.elegirOpcion(opcion.idOpcion),
    {
      onSuccess: (respuesta) => {
        if (respuesta.tirada) {
          this.destinoPendiente = { idNodo: respuesta.idNodo, idFinal: respuesta.idFinal };
          this.resultadoTirada.set(respuesta.tirada);
          return;
        }
        this.navegarA(respuesta.idNodo, respuesta.idFinal);
      },
      defaultErrorMessage: 'No se ha podido procesar la elección.',
    },
  );
  protected readonly eligiendo = this.elegirAction.loading;
  protected readonly eligiendoError = this.elegirAction.error;

  protected elegir(opcion: Opcion): void {
    this.elegirAction.run(opcion);
  }

  private readonly volverAtrasAction = asyncAction(() => this.partidaService.volverAtras(this.idAventura()!), {
    onSuccess: (respuesta) => {
      const idAventura = this.idAventura();
      void this.router.navigate(['/partida', respuesta.idNodoActual], {
        queryParams: idAventura !== null ? { idAventura } : undefined,
      });
    },
    defaultErrorMessage: 'No se ha podido volver a la página anterior.',
  });
  protected readonly volviendoAtras = this.volverAtrasAction.loading;
  protected readonly volverAtrasError = this.volverAtrasAction.error;

  protected volverAtras(): void {
    this.volverAtrasAction.run();
  }

  protected abrirPersonaje(): void {
    this.personajeAbierto.set(true);
  }

  protected continuarTrasTirada(): void {
    this.resultadoTirada.set(null);

    const destino = this.destinoPendiente;
    this.destinoPendiente = null;
    if (destino) {
      this.navegarA(destino.idNodo, destino.idFinal);
    }
  }

  protected volverAlEditor(): void {
    if (this.esAdmin()) {
      const idVersionAventura = this.idVersionAventura();
      if (idVersionAventura === null) {
        return;
      }
      this.adminService.detenerPrevisualizacionVersion(idVersionAventura).subscribe();
      void this.router.navigate(['/admin/aventuras']);
      return;
    }

    const idAventura = this.idAventura();
    if (idAventura === null) {
      return;
    }
    this.autorService.detenerPrevisualizacion(idAventura).subscribe();
    void this.router.navigate(['/autor/aventura', idAventura], { queryParams: { tab: 'contenido' } });
  }

  private navegarA(idNodo: number | null, idFinal: number | null): void {
    const esAdmin = this.esAdmin();
    const idVersionAventura = this.idVersionAventura();
    const idAventura = this.idAventura();

    const queryParams =
      esAdmin && idVersionAventura !== null
        ? { idVersionAventura, admin: true, preview: this.preview() || undefined }
        : idAventura !== null
          ? { idAventura, preview: this.preview() || undefined }
          : undefined;

    if (idFinal !== null) {
      void this.router.navigate(['/final', idFinal], { queryParams });
    } else if (idNodo !== null) {
      void this.router.navigate(['/partida', idNodo], { queryParams });
    }
  }
}
