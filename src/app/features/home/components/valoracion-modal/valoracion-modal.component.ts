import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StarRatingInputComponent } from '../../../../shared/components/star-rating-input/star-rating-input.component';
import { ValoracionService } from '../../data-access/valoracion.service';
import { GuardarValoracionRequest } from '../../models/valoracion.model';

@Component({
  selector: 'app-valoracion-modal',
  imports: [AreaTextoComponent, FormsModule, ModalComponent, StarRatingInputComponent],
  templateUrl: './valoracion-modal.component.html',
  styleUrl: './valoracion-modal.component.scss',
})
export class ValoracionModalComponent {
  private readonly valoracionService = inject(ValoracionService);

  readonly idAventura = input.required<number>();
  readonly cerrado = output<void>();

  protected readonly puntuacion = signal(0);
  protected readonly comentario = signal('');

  private readonly miValoracionResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.valoracionService.getMiValoracion(params),
  });
  protected readonly loading = this.miValoracionResource.isLoading;
  protected readonly error = computed(() => this.miValoracionResource.error() !== undefined);
  protected readonly puedeValorar = computed(() => this.miValoracionResource.value()?.puedeValorar ?? false);

  constructor() {
    effect(() => {
      const mia = this.miValoracionResource.value();
      if (mia) {
        this.puntuacion.set(mia.puntuacion ?? 0);
        this.comentario.set(mia.comentario ?? '');
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (dto: GuardarValoracionRequest) => this.valoracionService.guardarValoracion(dto),
    {
      canRun: () => this.puntuacion() > 0,
      defaultErrorMessage: 'No se ha podido guardar la valoración.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly guardarError = this.guardarAction.error;
  protected readonly guardadoOk = this.guardarAction.success;

  protected guardar(): void {
    this.guardarAction.run({
      idAventura: this.idAventura(),
      puntuacion: this.puntuacion(),
      comentario: this.comentario().trim() || null,
    });
  }

  protected noValorar(): void {
    this.cerrado.emit();
  }
}
