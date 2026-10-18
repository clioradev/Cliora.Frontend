import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { PreferenciasAplicadasService } from '../../../configuracion/data-access/preferencias-aplicadas.service';
import { PreferenciasService } from '../../../configuracion/data-access/preferencias.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  private readonly loginAction = asyncAction(
    (email: string, password: string) =>
      this.authService.login(email, password).pipe(
        switchMap(() =>
          this.preferenciasService.obtenerPreferencias().pipe(
            tap((preferencias) => this.preferenciasAplicadas.aplicar(preferencias)),
            catchError(() => of(null)),
          ),
        ),
        switchMap(() => this.authService.destinoTrasEntrar()),
      ),
    {
      onSuccess: (destino) => void this.router.navigateByUrl(destino),
      resolveErrorMessage: mensajeErrorLogin,
    },
  );
  protected readonly submitting = this.loginAction.loading;
  protected readonly error = this.loginAction.error;

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email, password } = this.form.getRawValue();
    this.loginAction.run(email, password);
  }
}

// 429 con hora: el email está bloqueado por fallar varias veces seguidas. 429 sin hora: demasiadas
// peticiones desde esta conexión.
function mensajeErrorLogin(err: unknown): string {
  if (err instanceof HttpErrorResponse && err.status === 429) {
    const bloqueadoHasta: string | undefined = err.error?.bloqueadoHasta;
    if (!bloqueadoHasta) {
      return 'Demasiados intentos. Espera un minuto y vuelve a probar.';
    }
    const hasta = new Date(bloqueadoHasta);
    const esHoy = hasta.toDateString() === new Date().toDateString();
    const hora = hasta.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const cuando = esHoy ? `a las ${hora}` : `mañana a las ${hora}`;
    return `Has fallado demasiadas veces seguidas. Por seguridad, podrás volver a intentarlo ${cuando}.`;
  }
  return 'Credenciales incorrectas.';
}
