import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TiradaResultado } from '../../models/partida.model';

@Component({
  selector: 'app-resultado-tirada-modal',
  imports: [ModalComponent],
  templateUrl: './resultado-tirada-modal.component.html',
  styleUrl: './resultado-tirada-modal.component.scss',
})
export class ResultadoTiradaModalComponent {
  readonly resultado = input.required<TiradaResultado>();
  readonly aceptar = output<void>();

  protected dadosTexto(): string {
    return this.resultado().dados.join(', ');
  }
}
