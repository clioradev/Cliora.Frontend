import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AlertaService } from '../../../alertas/data-access/alerta.service';

const LONGITUD_MAXIMA_COMENTARIO = 2000;

/**
 * Confirmación de «Informar de error» (solo revisores), con un comentario opcional. El paso extra
 * evita alertas por un toque accidental en el botón del nodo.
 */
@Component({
  selector: 'app-informar-error-modal',
  imports: [AreaTextoComponent, FormsModule, ModalComponent],
  templateUrl: './informar-error-modal.component.html',
  styleUrl: './informar-error-modal.component.scss',
})
export class InformarErrorModalComponent {
  private readonly alertaService = inject(AlertaService);

  readonly idNodo = input.required<number>();
  /** Emite cuántos revisores tienen ya la alerta abierta en el nodo. */
  readonly informado = output<number>();
  readonly cerrado = output<void>();

  protected readonly longitudMaxima = LONGITUD_MAXIMA_COMENTARIO;
  protected readonly comentario = signal('');
  protected readonly demasiadoLargo = computed(() => this.comentario().length > LONGITUD_MAXIMA_COMENTARIO);

  private readonly enviarAction = asyncAction(
    () => this.alertaService.informar(this.idNodo(), this.comentario().trim() || null),
    {
      onSuccess: (respuesta) => this.informado.emit(respuesta.numeroAlertas),
      defaultErrorMessage: 'No se ha podido informar del error.',
    },
  );
  protected readonly enviando = this.enviarAction.loading;
  protected readonly error = this.enviarAction.error;

  protected enviar(): void {
    if (!this.demasiadoLargo()) {
      this.enviarAction.run();
    }
  }
}
