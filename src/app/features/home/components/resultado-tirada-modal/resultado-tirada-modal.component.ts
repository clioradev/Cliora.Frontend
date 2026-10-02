import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TiradaResultado } from '../../models/partida.model';
import { TIPO_TIRADA_D20, TIPO_TIRADA_PORCENTAJE } from '../../models/universo.model';

@Component({
  selector: 'app-resultado-tirada-modal',
  imports: [ModalComponent],
  templateUrl: './resultado-tirada-modal.component.html',
  styleUrl: './resultado-tirada-modal.component.scss',
})
export class ResultadoTiradaModalComponent {
  readonly resultado = input.required<TiradaResultado>();
  readonly aceptar = output<void>();

  protected readonly TIPO_TIRADA_D20 = TIPO_TIRADA_D20;
  protected readonly TIPO_TIRADA_PORCENTAJE = TIPO_TIRADA_PORCENTAJE;

  protected dadosTexto(): string {
    return this.resultado().dados.join(', ');
  }

  /** « + Espada 3 + Espada enana 1», lo que se suma a los dados en 4d6 y D20. */
  protected sumandosTexto(): string {
    const r = this.resultado();
    let texto = r.nombreCaracteristica ? ` + ${r.nombreCaracteristica} ${r.valorCaracteristica}` : '';
    if (r.nombreModificador) {
      texto += ` + ${r.nombreModificador} ${r.valorModificador}`;
    }
    return texto;
  }

  /** «Rastrear 45 + Arco élfico 10 − 5 de dificultad». */
  protected objetivoPorcentajeTexto(): string {
    const r = this.resultado();
    let texto = `${r.nombreCaracteristica || 'característica'} ${r.valorCaracteristica}`;
    if (r.nombreModificador) {
      texto += ` + ${r.nombreModificador} ${r.valorModificador}`;
    }
    if (r.dificultad) {
      texto += ` − ${r.dificultad} de dificultad`;
    }
    return texto;
  }
}
