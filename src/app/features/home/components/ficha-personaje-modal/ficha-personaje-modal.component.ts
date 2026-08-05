import { Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PartidaService } from '../../data-access/partida.service';

@Component({
  selector: 'app-ficha-personaje-modal',
  imports: [ModalComponent],
  templateUrl: './ficha-personaje-modal.component.html',
  styleUrl: './ficha-personaje-modal.component.scss',
})
export class FichaPersonajeModalComponent {
  private readonly partidaService = inject(PartidaService);

  readonly idNodo = input.required<number>();
  readonly cerrado = output<void>();

  private readonly personajeResource = rxResource({
    params: () => this.idNodo(),
    stream: ({ params }) => this.partidaService.getPersonaje(params),
  });
  protected readonly loading = this.personajeResource.isLoading;
  protected readonly error = computed(() => this.personajeResource.error() !== undefined);
  protected readonly grupos = computed(() => this.personajeResource.value()?.grupos ?? []);
}
