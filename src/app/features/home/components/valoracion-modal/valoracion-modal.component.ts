import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StarRatingInputComponent } from '../../../../shared/components/star-rating-input/star-rating-input.component';
import { ValoracionService } from '../../data-access/valoracion.service';

@Component({
  selector: 'app-valoracion-modal',
  imports: [ModalComponent, StarRatingInputComponent],
  templateUrl: './valoracion-modal.component.html',
  styleUrl: './valoracion-modal.component.scss',
})
export class ValoracionModalComponent implements OnInit {
  private readonly valoracionService = inject(ValoracionService);

  readonly idAventura = input.required<number>();
  readonly cerrado = output<void>();

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly puedeValorar = signal(false);
  protected readonly puntuacion = signal(0);
  protected readonly comentario = signal('');
  protected readonly guardando = signal(false);
  protected readonly guardadoOk = signal(false);
  protected readonly guardarError = signal<string | null>(null);

  ngOnInit(): void {
    this.valoracionService.getMiValoracion(this.idAventura()).subscribe({
      next: (mia) => {
        this.puedeValorar.set(mia.puedeValorar);
        this.puntuacion.set(mia.puntuacion ?? 0);
        this.comentario.set(mia.comentario ?? '');
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }

  protected onComentarioInput(event: Event): void {
    this.comentario.set((event.target as HTMLTextAreaElement).value);
  }

  protected guardar(): void {
    if (this.guardando() || this.puntuacion() <= 0) {
      return;
    }

    this.guardando.set(true);
    this.guardarError.set(null);

    this.valoracionService
      .guardarValoracion({
        idAventura: this.idAventura(),
        puntuacion: this.puntuacion(),
        comentario: this.comentario().trim() || null,
      })
      .subscribe({
        next: () => {
          this.guardando.set(false);
          this.guardadoOk.set(true);
        },
        error: (err: { error?: string[] }) => {
          this.guardando.set(false);
          this.guardarError.set(
            Array.isArray(err.error) ? err.error.join(' ') : 'No se ha podido guardar la valoración.',
          );
        },
      });
  }
}
