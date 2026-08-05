import { Component, inject, input, output } from '@angular/core';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PartidaService } from '../../data-access/partida.service';

@Component({
  selector: 'app-reiniciar-aventura-modal',
  imports: [ModalComponent],
  templateUrl: './reiniciar-aventura-modal.component.html',
  styleUrl: './reiniciar-aventura-modal.component.scss',
})
export class ReiniciarAventuraModalComponent {
  private readonly partidaService = inject(PartidaService);

  readonly idAventura = input.required<number>();
  readonly cerrado = output<void>();
  readonly reiniciada = output<void>();

  private readonly reiniciarAction = asyncAction(() => this.partidaService.reiniciarAventura(this.idAventura()), {
    onSuccess: () => this.reiniciada.emit(),
    defaultErrorMessage: 'No se ha podido reiniciar la aventura.',
  });
  protected readonly reiniciando = this.reiniciarAction.loading;
  protected readonly error = this.reiniciarAction.error;

  protected confirmar(): void {
    this.reiniciarAction.run();
  }
}
