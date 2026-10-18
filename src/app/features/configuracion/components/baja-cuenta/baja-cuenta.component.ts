import { Component, effect, inject, input, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { CuentaService } from '../../data-access/cuenta.service';

/** Inicio → aviso en modal → código del email → motivo opcional → baja. */
type Paso = 'inicio' | 'aviso' | 'codigo' | 'motivo';

export const LONGITUD_MAXIMA_MOTIVO = 2000;

@Component({
  selector: 'app-baja-cuenta',
  imports: [ModalComponent],
  templateUrl: './baja-cuenta.component.html',
  styleUrl: './baja-cuenta.component.scss',
})
export class BajaCuentaComponent {
  private readonly cuentaService = inject(CuentaService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly email = input.required<string>();
  /** Ya tiene un código de baja vigente: se sigue por el paso del código. */
  readonly bajaPendiente = input(false);

  protected readonly paso = signal<Paso>('inicio');
  protected readonly codigo = signal('');
  protected readonly motivo = signal('');
  protected readonly codigoReenviado = signal(false);
  protected readonly longitudMaximaMotivo = LONGITUD_MAXIMA_MOTIVO;

  constructor() {
    // Solo depende de la entrada: si dependiera del paso, al cancelar volvería al código.
    effect(() => {
      if (this.bajaPendiente()) {
        untracked(() => {
          if (this.paso() === 'inicio') {
            this.paso.set('codigo');
          }
        });
      }
    });
  }

  private readonly solicitarAction = asyncAction(() => this.cuentaService.solicitarBaja(), {
    onSuccess: () => {
      this.codigo.set('');
      this.paso.set('codigo');
    },
    defaultErrorMessage: 'No se ha podido enviar el código.',
  });
  protected readonly solicitando = this.solicitarAction.loading;
  protected readonly errorSolicitar = this.solicitarAction.error;

  private readonly reenviarAction = asyncAction(() => this.cuentaService.solicitarBaja(), {
    onSuccess: () => this.codigoReenviado.set(true),
    defaultErrorMessage: 'No se ha podido reenviar el código.',
  });
  protected readonly reenviando = this.reenviarAction.loading;
  protected readonly errorReenviar = this.reenviarAction.error;

  private readonly comprobarAction = asyncAction(() => this.cuentaService.comprobarCodigoBaja(this.codigo().trim()), {
    canRun: () => this.codigo().trim().length > 0,
    onSuccess: () => this.paso.set('motivo'),
    defaultErrorMessage: 'No se ha podido comprobar el código.',
  });
  protected readonly comprobando = this.comprobarAction.loading;
  protected readonly errorComprobar = this.comprobarAction.error;

  // Tras la baja la sesión ya no vale: se cierra (sin esperar a que el servidor acepte el logout) y
  // se sale a la despedida, fuera de las páginas que piden sesión.
  private readonly confirmarAction = asyncAction(
    () =>
      this.cuentaService.confirmarBaja(this.codigo().trim(), this.motivo().trim() || null).pipe(
        switchMap(() => this.authService.logout().pipe(catchError(() => of(undefined)))),
      ),
    {
      onSuccess: () => {
        this.authService.clearSession();
        void this.router.navigate(['/bienvenida/hasta-pronto']);
      },
      defaultErrorMessage: 'No se ha podido completar la baja.',
    },
  );
  protected readonly confirmando = this.confirmarAction.loading;
  protected readonly errorConfirmar = this.confirmarAction.error;

  private readonly cancelarAction = asyncAction(() => this.cuentaService.cancelarBaja(), {
    onSuccess: () => this.reiniciar(),
  });
  protected readonly cancelando = this.cancelarAction.loading;

  protected abrirAviso(): void {
    this.solicitarAction.reset();
    this.paso.set('aviso');
  }

  protected cerrarAviso(): void {
    if (!this.solicitando()) {
      this.paso.set('inicio');
    }
  }

  protected solicitar(): void {
    this.solicitarAction.run();
  }

  protected reenviar(): void {
    this.codigoReenviado.set(false);
    this.reenviarAction.run();
  }

  protected comprobar(): void {
    this.comprobarAction.run();
  }

  protected confirmar(): void {
    this.confirmarAction.run();
  }

  protected cancelar(): void {
    this.cancelarAction.run();
  }

  protected onCodigoInput(evento: Event): void {
    this.codigo.set((evento.target as HTMLInputElement).value);
  }

  protected onMotivoInput(evento: Event): void {
    this.motivo.set((evento.target as HTMLTextAreaElement).value);
  }

  private reiniciar(): void {
    this.paso.set('inicio');
    this.codigo.set('');
    this.motivo.set('');
    this.codigoReenviado.set(false);
    this.comprobarAction.reset();
    this.confirmarAction.reset();
  }
}
