import { Component, input, output } from '@angular/core';
import { Observable } from 'rxjs';
import { asyncAction } from '../../../core/utils/async-action';
import { ModalComponent } from '../modal/modal.component';

@Component({
  selector: 'app-confirmar-eliminar-modal',
  imports: [ModalComponent],
  templateUrl: './confirmar-eliminar-modal.component.html',
  styleUrl: './confirmar-eliminar-modal.component.scss',
})
export class ConfirmarEliminarModalComponent {
  readonly titulo = input.required<string>();
  readonly mensaje = input.required<string>();
  readonly accion = input.required<() => Observable<void>>();
  readonly cerrado = output<void>();
  readonly eliminado = output<void>();

  private readonly eliminarAction = asyncAction(() => this.accion()(), {
    onSuccess: () => this.eliminado.emit(),
    defaultErrorMessage: 'No se ha podido eliminar.',
  });
  protected readonly eliminando = this.eliminarAction.loading;
  protected readonly error = this.eliminarAction.error;

  protected confirmar(): void {
    this.eliminarAction.run();
  }
}
