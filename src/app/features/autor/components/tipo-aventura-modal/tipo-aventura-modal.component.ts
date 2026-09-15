import { Component, output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';

@Component({
  selector: 'app-tipo-aventura-modal',
  imports: [ModalComponent],
  templateUrl: './tipo-aventura-modal.component.html',
  styleUrl: './tipo-aventura-modal.component.scss',
})
export class TipoAventuraModalComponent {
  readonly cerrado = output<void>();
  readonly elegido = output<boolean>();

  protected elegir(esLibro: boolean): void {
    this.elegido.emit(esLibro);
  }
}
