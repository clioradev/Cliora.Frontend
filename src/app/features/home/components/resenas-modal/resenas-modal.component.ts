import { DatePipe } from '@angular/common';
import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { ValoracionService } from '../../data-access/valoracion.service';
import { UltimaValoracion } from '../../models/valoracion.model';

export type NivelValoracion = 'Aventura' | 'Campana' | 'Universo';

@Component({
  selector: 'app-resenas-modal',
  imports: [ModalComponent, StarRatingDisplayComponent, DatePipe],
  templateUrl: './resenas-modal.component.html',
  styleUrl: './resenas-modal.component.scss',
})
export class ResenasModalComponent implements OnInit {
  private readonly valoracionService = inject(ValoracionService);

  readonly nivel = input.required<NivelValoracion>();
  readonly id = input.required<number>();
  readonly titulo = input<string>('');
  readonly cerrado = output<void>();

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly valoraciones = signal<UltimaValoracion[]>([]);

  ngOnInit(): void {
    const obs$ =
      this.nivel() === 'Aventura'
        ? this.valoracionService.getValoracionesAventura(this.id())
        : this.nivel() === 'Campana'
          ? this.valoracionService.getValoracionesCampana(this.id())
          : this.valoracionService.getValoracionesUniverso(this.id());

    obs$.subscribe({
      next: (valoraciones) => {
        this.valoraciones.set(valoraciones);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
