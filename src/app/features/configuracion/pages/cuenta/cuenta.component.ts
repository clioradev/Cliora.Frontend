import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { ProgresoAventuraGratisComponent } from '../../../../shared/components/progreso-aventura-gratis/progreso-aventura-gratis.component';
import { CuentaService } from '../../data-access/cuenta.service';

@Component({
  selector: 'app-cuenta',
  imports: [DatePipe, ProgresoAventuraGratisComponent],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.scss',
})
export class CuentaComponent {
  private readonly cuentaService = inject(CuentaService);
  private readonly authService = inject(AuthService);

  private readonly perfilResource = rxResource({
    stream: () => this.cuentaService.obtenerPerfil(),
  });
  protected readonly perfil = this.perfilResource.value;
  protected readonly cargando = this.perfilResource.isLoading;
  protected readonly errorCarga = computed(() => this.perfilResource.error() !== undefined);

  // --- Nombre ---
  protected readonly nombre = signal('');
  protected readonly nombreCambiado = computed(() => {
    const nombre = this.nombre().trim();
    return nombre.length > 0 && nombre !== this.perfil()?.nombre;
  });
  protected readonly nombreGuardado = signal(false);

  constructor() {
    effect(() => {
      const perfil = this.perfil();
      if (perfil) {
        this.nombre.set(perfil.nombre);
      }
    });
  }

  // Tras el cambio se renueva el token para que el menú y el resto de la app vean el dato nuevo.
  private readonly nombreAction = asyncAction(
    () => this.cuentaService.cambiarNombre(this.nombre().trim()).pipe(switchMap(() => this.authService.refresh())),
    {
      canRun: () => this.nombreCambiado(),
      onSuccess: () => {
        this.nombreGuardado.set(true);
        this.perfilResource.reload();
      },
      defaultErrorMessage: 'No se ha podido cambiar el nombre.',
    },
  );
  protected readonly guardandoNombre = this.nombreAction.loading;
  protected readonly errorNombre = this.nombreAction.error;

  protected onNombreInput(evento: Event): void {
    this.nombre.set((evento.target as HTMLInputElement).value);
    this.nombreGuardado.set(false);
  }

  protected guardarNombre(): void {
    this.nombreAction.run();
  }

  // --- Email ---
  protected readonly editandoEmail = signal(false);
  protected readonly emailNuevo = signal('');
  protected readonly password = signal('');
  protected readonly codigo = signal('');
  protected readonly emailCambiado = signal(false);
  protected readonly codigoReenviado = signal(false);

  protected readonly emailPendiente = computed(() => this.perfil()?.emailPendiente ?? null);

  private readonly solicitarAction = asyncAction(
    () => this.cuentaService.solicitarCambioEmail(this.emailNuevo().trim(), this.password()),
    {
      canRun: () => this.emailNuevo().trim().length > 0 && this.password().length > 0,
      onSuccess: () => {
        this.editandoEmail.set(false);
        this.password.set('');
        this.codigo.set('');
        this.perfilResource.reload();
      },
      defaultErrorMessage: 'No se ha podido enviar el código.',
    },
  );
  protected readonly solicitando = this.solicitarAction.loading;
  protected readonly errorSolicitar = this.solicitarAction.error;

  private readonly confirmarAction = asyncAction(
    () => this.cuentaService.confirmarCambioEmail(this.codigo().trim()).pipe(switchMap(() => this.authService.refresh())),
    {
      canRun: () => this.codigo().trim().length > 0,
      onSuccess: () => {
        this.emailCambiado.set(true);
        this.codigo.set('');
        this.perfilResource.reload();
      },
      defaultErrorMessage: 'No se ha podido confirmar el código.',
    },
  );
  protected readonly confirmando = this.confirmarAction.loading;
  protected readonly errorConfirmar = this.confirmarAction.error;

  private readonly reenviarAction = asyncAction(() => this.cuentaService.reenviarCodigo(), {
    onSuccess: () => this.codigoReenviado.set(true),
    defaultErrorMessage: 'No se ha podido reenviar el código.',
  });
  protected readonly reenviando = this.reenviarAction.loading;
  protected readonly errorReenviar = this.reenviarAction.error;

  private readonly cancelarAction = asyncAction(() => this.cuentaService.cancelarCambioEmail(), {
    onSuccess: () => this.perfilResource.reload(),
  });
  protected readonly cancelando = this.cancelarAction.loading;

  protected empezarCambioEmail(): void {
    this.editandoEmail.set(true);
    this.emailCambiado.set(false);
    this.emailNuevo.set('');
    this.password.set('');
    this.solicitarAction.reset();
  }

  protected cancelarEdicionEmail(): void {
    this.editandoEmail.set(false);
  }

  protected onEmailNuevoInput(evento: Event): void {
    this.emailNuevo.set((evento.target as HTMLInputElement).value);
  }

  protected onPasswordInput(evento: Event): void {
    this.password.set((evento.target as HTMLInputElement).value);
  }

  protected onCodigoInput(evento: Event): void {
    this.codigo.set((evento.target as HTMLInputElement).value);
  }

  protected solicitarCambioEmail(): void {
    this.solicitarAction.run();
  }

  protected confirmarCambioEmail(): void {
    this.confirmarAction.run();
  }

  protected reenviarCodigo(): void {
    this.codigoReenviado.set(false);
    this.reenviarAction.run();
  }

  protected cancelarCambioEmail(): void {
    this.cancelarAction.run();
  }
}
