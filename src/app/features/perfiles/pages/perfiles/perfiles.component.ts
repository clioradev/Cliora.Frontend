import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { catchError, map, Observable, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { PerfilFamilia } from '../../../../core/auth/usuario.model';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PreferenciasAplicadasService } from '../../../configuracion/data-access/preferencias-aplicadas.service';
import { PreferenciasService } from '../../../configuracion/data-access/preferencias.service';

/**
 * Selector de perfiles, como el de las plataformas de vídeo. El padre deja el dispositivo en el
 * perfil de un hijo; desde un hijo, ir a cualquier otro perfil pide la contraseña del padre.
 */
@Component({
  selector: 'app-perfiles',
  imports: [ModalComponent],
  templateUrl: './perfiles.component.html',
  styleUrl: './perfiles.component.scss',
})
export class PerfilesComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);

  private readonly perfilesResource = rxResource({ stream: () => this.authService.perfiles() });
  protected readonly perfiles = computed(() => this.perfilesResource.value() ?? []);
  protected readonly cargando = this.perfilesResource.isLoading;
  protected readonly errorCarga = computed(() => this.perfilesResource.error() !== undefined);

  protected readonly usuario = this.authService.currentUser;
  protected readonly enPerfilDeHijo = computed(() => this.usuario()?.esHijo ?? false);
  protected readonly padre = computed(() => this.perfiles().find((p) => !p.esHijo) ?? null);

  /** Perfil al que se quiere ir desde el de un hijo: se pide la contraseña del padre. */
  protected readonly destino = signal<PerfilFamilia | null>(null);
  protected readonly password = signal('');

  private readonly cambiarAction = asyncAction(
    (perfil: PerfilFamilia, password: string | null) => this.cambiarA(perfil, password),
    {
      onSuccess: () => {
        this.destino.set(null);
        void this.router.navigate(['/']);
      },
      resolveErrorMessage: mensajeError,
    },
  );
  protected readonly cambiando = this.cambiarAction.loading;
  protected readonly error = this.cambiarAction.error;

  protected elegir(perfil: PerfilFamilia): void {
    if (perfil.idUsuario === this.usuario()?.idUsuario) {
      void this.router.navigate(['/']);
      return;
    }
    if (this.enPerfilDeHijo()) {
      this.password.set('');
      this.cambiarAction.reset();
      this.destino.set(perfil);
      return;
    }
    this.cambiarAction.run(perfil, null);
  }

  protected onPasswordInput(evento: Event): void {
    this.password.set((evento.target as HTMLInputElement).value);
  }

  protected confirmarPassword(): void {
    const destino = this.destino();
    if (destino && this.password()) {
      this.cambiarAction.run(destino, this.password());
    }
  }

  protected cerrarModal(): void {
    this.destino.set(null);
  }

  protected inicial(perfil: PerfilFamilia): string {
    return perfil.nombre.trim().charAt(0).toUpperCase() || '?';
  }

  private cambiarA(perfil: PerfilFamilia, password: string | null): Observable<void> {
    const alPadre: Observable<unknown> = password !== null ? this.authService.volverAlPadre(password) : of(null);
    return alPadre.pipe(
      switchMap((): Observable<unknown> => (perfil.esHijo ? this.authService.entrarEnPerfil(perfil.idUsuario) : of(null))),
      // Cada perfil tiene sus preferencias de lectura.
      switchMap(() =>
        this.preferenciasService.obtenerPreferencias().pipe(
          tap((preferencias) => this.preferenciasAplicadas.aplicar(preferencias)),
          catchError(() => of(null)),
        ),
      ),
      map(() => undefined),
    );
  }
}

function mensajeError(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 429) {
    const bloqueadoHasta: string | undefined = err.error?.bloqueadoHasta;
    if (bloqueadoHasta) {
      const hora = new Date(bloqueadoHasta).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
      return `Demasiados intentos fallidos. Podrás volver a intentarlo a las ${hora}.`;
    }
    return 'Demasiados intentos. Espera un minuto y vuelve a probar.';
  }
  if (err instanceof HttpErrorResponse && err.status === 400) {
    return 'La contraseña no es correcta.';
  }
  return 'No se ha podido cambiar de perfil.';
}
