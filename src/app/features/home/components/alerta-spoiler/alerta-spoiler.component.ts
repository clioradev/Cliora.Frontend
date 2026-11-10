import { Component, inject, input, output, signal } from '@angular/core';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { UniversoService } from '../../data-access/universo.service';

/**
 * Campaña con alerta de spoiler que el lector aún no ha abierto: en lugar de su contenido se ve el
 * aviso. Al pulsarlo se pide confirmación, porque una vez abierta queda abierta para siempre.
 */
@Component({
  selector: 'app-alerta-spoiler',
  imports: [ModalComponent],
  templateUrl: './alerta-spoiler.component.html',
  styleUrl: './alerta-spoiler.component.scss',
})
export class AlertaSpoilerComponent {
  private readonly universoService = inject(UniversoService);

  readonly idCampana = input.required<number>();
  readonly texto = input.required<string>();
  /** La campaña se ha abierto: hay que recargar el listado. */
  readonly desbloqueada = output<void>();

  protected readonly confirmando = signal(false);

  private readonly desbloquearAction = asyncAction(() => this.universoService.desbloquearSpoiler(this.idCampana()), {
    onSuccess: () => {
      this.confirmando.set(false);
      this.desbloqueada.emit();
    },
    defaultErrorMessage: 'No se ha podido desbloquear la campaña.',
  });
  protected readonly desbloqueando = this.desbloquearAction.loading;
  protected readonly error = this.desbloquearAction.error;

  protected confirmar(): void {
    this.desbloquearAction.run();
  }
}
