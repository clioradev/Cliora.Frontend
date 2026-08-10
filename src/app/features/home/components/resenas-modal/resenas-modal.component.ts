import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { ValoracionService } from '../../data-access/valoracion.service';

export type NivelValoracion = 'Aventura' | 'Campana' | 'Universo';

@Component({
  selector: 'app-resenas-modal',
  imports: [ModalComponent, StarRatingDisplayComponent, DatePipe],
  templateUrl: './resenas-modal.component.html',
  styleUrl: './resenas-modal.component.scss',
})
export class ResenasModalComponent {
  private readonly valoracionService = inject(ValoracionService);

  readonly nivel = input.required<NivelValoracion>();
  readonly id = input.required<number>();
  readonly titulo = input<string>('');
  readonly cerrado = output<void>();

  private readonly valoracionesResource = rxResource({
    params: () => ({ nivel: this.nivel(), id: this.id() }),
    stream: ({ params }) =>
      params.nivel === 'Aventura'
        ? this.valoracionService.getValoracionesAventura(params.id)
        : params.nivel === 'Campana'
          ? this.valoracionService.getValoracionesCampana(params.id)
          : this.valoracionService.getValoracionesUniverso(params.id),
    defaultValue: [],
  });
  protected readonly loading = this.valoracionesResource.isLoading;
  protected readonly error = computed(() => this.valoracionesResource.error() !== undefined);
  protected readonly valoraciones = this.valoracionesResource.value;
}
