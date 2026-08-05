import { Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { FichaPersonajeModalComponent } from '../../components/ficha-personaje-modal/ficha-personaje-modal.component';
import { ResultadoTiradaModalComponent } from '../../components/resultado-tirada-modal/resultado-tirada-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { Opcion, TiradaResultado } from '../../models/partida.model';

@Component({
  selector: 'app-partida',
  imports: [ResultadoTiradaModalComponent, FichaPersonajeModalComponent],
  templateUrl: './partida.component.html',
  styleUrl: './partida.component.scss',
})
export class PartidaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);

  private readonly paramMap = toSignal(this.route.paramMap, { requireSync: true });
  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });

  protected readonly idAventura = computed(() => {
    const idAventuraParam = this.queryParamMap().get('idAventura');
    return idAventuraParam ? Number(idAventuraParam) : null;
  });

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

  private navegarA(idNodo: number | null, idFinal: number | null): void {
    const idAventura = this.idAventura();
    const queryParams = idAventura !== null ? { idAventura } : undefined;

    if (idFinal !== null) {
      void this.router.navigate(['/final', idFinal], { queryParams });
    } else if (idNodo !== null) {
      void this.router.navigate(['/partida', idNodo], { queryParams });
    }
  }
}
