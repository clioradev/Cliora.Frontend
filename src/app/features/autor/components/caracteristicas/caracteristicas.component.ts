import { Component, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable, map } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AutorService } from '../../data-access/autor.service';
import { CaracteristicaAutor, EventoAutor, FinalAutor, VariableSinUsoAutor, VariablesSinUsoAutor } from '../../models/autor.model';
import { CaracteristicaFormModalComponent } from '../caracteristica-form-modal/caracteristica-form-modal.component';
import { EventoFormModalComponent } from '../evento-form-modal/evento-form-modal.component';
import { FinalFormModalComponent } from '../final-form-modal/final-form-modal.component';

interface EliminarModalState {
  titulo: string;
  mensaje: string;
  accion: () => Observable<void>;
}

@Component({
  selector: 'app-caracteristicas',
  imports: [
    IconoComponent,
    CaracteristicaFormModalComponent,
    FinalFormModalComponent,
    EventoFormModalComponent,
    ConfirmarEliminarModalComponent,
  ],
  templateUrl: './caracteristicas.component.html',
  styleUrl: './caracteristicas.component.scss',
})
export class CaracteristicasComponent {
  private readonly autorService = inject(AutorService);

  readonly idAventura = input.required<number>();
  readonly esLibro = input(false);

  private readonly caracteristicasResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.autorService.getCaracteristicas(params),
  });
  protected readonly caracteristicas = this.caracteristicasResource.value;

  private readonly finalesResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.autorService.getFinales(params),
  });
  protected readonly finales = this.finalesResource.value;

  private readonly eventosResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.autorService.getEventos(params),
  });
  protected readonly eventos = this.eventosResource.value;

  protected readonly caracteristicaModal = signal<CaracteristicaAutor | 'nuevo' | null>(null);
  protected readonly finalModal = signal<FinalAutor | 'nuevo' | null>(null);
  protected readonly eventoModal = signal<EventoAutor | 'nuevo' | null>(null);
  protected readonly eliminarModal = signal<EliminarModalState | null>(null);

  protected nuevaCaracteristica(): void {
    this.caracteristicaModal.set('nuevo');
  }

  protected editarCaracteristica(caracteristica: CaracteristicaAutor): void {
    this.caracteristicaModal.set(caracteristica);
  }

  protected cerrarCaracteristicaModal(): void {
    this.caracteristicaModal.set(null);
  }

  protected onCaracteristicaGuardada(): void {
    this.caracteristicaModal.set(null);
    this.caracteristicasResource.reload();
  }

  protected eliminarCaracteristica(caracteristica: CaracteristicaAutor): void {
    this.eliminarModal.set({
      titulo: `Eliminar característica "${caracteristica.nombre}"`,
      mensaje: `¿Seguro que quieres eliminar la característica "${caracteristica.nombre}"?`,
      accion: () => this.autorService.eliminarCaracteristica(caracteristica.idCaracteristica),
    });
  }

  protected nuevoFinal(): void {
    this.finalModal.set('nuevo');
  }

  protected editarFinal(final: FinalAutor): void {
    this.finalModal.set(final);
  }

  protected cerrarFinalModal(): void {
    this.finalModal.set(null);
  }

  protected onFinalGuardado(): void {
    this.finalModal.set(null);
    this.finalesResource.reload();
  }

  protected eliminarFinal(final: FinalAutor): void {
    this.eliminarModal.set({
      titulo: `Eliminar final "${final.titulo}"`,
      mensaje: `¿Seguro que quieres eliminar el final "${final.titulo}"?`,
      accion: () => this.autorService.eliminarFinal(final.idFinal),
    });
  }

  protected nuevoEvento(): void {
    this.eventoModal.set('nuevo');
  }

  protected editarEvento(evento: EventoAutor): void {
    this.eventoModal.set(evento);
  }

  protected cerrarEventoModal(): void {
    this.eventoModal.set(null);
  }

  protected onEventoGuardado(): void {
    this.eventoModal.set(null);
    this.eventosResource.reload();
  }

  protected eliminarEvento(evento: EventoAutor): void {
    this.eliminarModal.set({
      titulo: `Eliminar evento "${evento.nombre}"`,
      mensaje: `¿Seguro que quieres eliminar el evento "${evento.nombre}"?`,
      accion: () => this.autorService.eliminarEvento(evento.idEvento),
    });
  }

  // «Limpiar»: primero se pregunta al servidor qué no se usa (también mira las otras aventuras de la
  // campaña) y se enseña en la confirmación; al confirmar solo se borra lo que el autor ha visto.
  private readonly buscarSinUsoAction = asyncAction(() => this.autorService.getVariablesSinUso(this.idAventura()), {
    onSuccess: (sinUso) => this.confirmarLimpiar(sinUso),
    defaultErrorMessage: 'No se han podido buscar las variables sin usar.',
  });
  protected readonly buscandoSinUso = this.buscarSinUsoAction.loading;
  protected readonly errorLimpiar = this.buscarSinUsoAction.error;
  protected readonly nadaQueLimpiar = signal(false);

  protected limpiar(): void {
    this.nadaQueLimpiar.set(false);
    this.buscarSinUsoAction.run();
  }

  private confirmarLimpiar(sinUso: VariablesSinUsoAutor): void {
    const { caracteristicas, eventos } = sinUso;
    if (caracteristicas.length === 0 && eventos.length === 0) {
      this.nadaQueLimpiar.set(true);
      return;
    }

    const partes = [
      this.describirSinUso(caracteristicas, 'característica', 'características'),
      this.describirSinUso(eventos, 'evento', 'eventos'),
    ].filter((parte) => parte !== null);
    this.eliminarModal.set({
      titulo: 'Limpiar variables sin usar',
      mensaje:
        `Se eliminarán ${partes.join(' y ')}. Ninguna condición, efecto ni tirada las usa, ` +
        'ni en esta aventura ni en las demás de la campaña.',
      accion: () =>
        this.autorService
          .limpiarVariables(
            this.idAventura(),
            caracteristicas.map((c) => c.id),
            eventos.map((e) => e.id),
          )
          .pipe(map(() => undefined)),
    });
  }

  private describirSinUso(lista: VariableSinUsoAutor[], singular: string, plural: string): string | null {
    if (lista.length === 0) {
      return null;
    }
    const nombres = lista.map((v) => `"${v.nombre}"`).join(', ');
    return `${lista.length} ${lista.length === 1 ? singular : plural} (${nombres})`;
  }

  protected cerrarEliminarModal(): void {
    this.eliminarModal.set(null);
  }

  protected onEliminado(): void {
    this.eliminarModal.set(null);
    this.caracteristicasResource.reload();
    this.finalesResource.reload();
    this.eventosResource.reload();
  }
}
