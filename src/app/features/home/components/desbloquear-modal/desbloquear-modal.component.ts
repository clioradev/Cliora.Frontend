import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SuscripcionService } from '../../../tienda/data-access/suscripcion.service';

/**
 * Perfil de hijo que toca una aventura con candado. Sin ningún reclamo para suscribirse: solo
 * explica que hace falta el padre y, si la prueba gratuita de su tramo está libre, deja que el
 * padre la active ahí mismo con su contraseña.
 */
@Component({
  selector: 'app-desbloquear-modal',
  imports: [ModalComponent],
  templateUrl: './desbloquear-modal.component.html',
  styleUrl: './desbloquear-modal.component.scss',
})
export class DesbloquearModalComponent {
  private readonly suscripcionService = inject(SuscripcionService);

  readonly cerrado = output<void>();
  /** La prueba se ha activado: hay que recargar el listado. */
  readonly desbloqueado = output<void>();

  private readonly estadoResource = rxResource({ stream: () => this.suscripcionService.obtenerEstadoPrueba() });
  protected readonly estado = this.estadoResource.value;
  protected readonly cargando = this.estadoResource.isLoading;

  protected readonly password = signal('');
  protected readonly activada = signal(false);

  private readonly activarAction = asyncAction(() => this.suscripcionService.activarPrueba(this.password()), {
    canRun: () => this.password().length > 0,
    onSuccess: () => this.activada.set(true),
    resolveErrorMessage: mensajeError,
  });
  protected readonly activando = this.activarAction.loading;
  protected readonly error = this.activarAction.error;
  protected readonly dias = computed(() => this.estado()?.diasPrueba ?? 9);

  protected onPasswordInput(evento: Event): void {
    this.password.set((evento.target as HTMLInputElement).value);
  }

  protected activar(): void {
    this.activarAction.run();
  }

  protected cerrar(): void {
    if (this.activada()) {
      this.desbloqueado.emit();
    }
    this.cerrado.emit();
  }
}

function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 429) {
    const bloqueadoHasta: string | undefined = err.error?.bloqueadoHasta;
    if (bloqueadoHasta) {
      const hora = new Date(bloqueadoHasta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `Demasiados intentos fallidos. Se podrá volver a probar a las ${hora}.`;
    }
    return 'Demasiados intentos. Espera un minuto.';
  }
  if (err instanceof HttpErrorResponse && Array.isArray(err.error) && typeof err.error[0] === 'string') {
    return err.error[0];
  }
  return 'No se ha podido desbloquear.';
}
