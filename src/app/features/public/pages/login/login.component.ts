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
      ),
    {
      onSuccess: () => void this.router.navigate(['/']),
      defaultErrorMessage: 'Credenciales incorrectas.',
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
