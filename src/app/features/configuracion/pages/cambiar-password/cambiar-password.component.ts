import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const nueva = control.get('passwordNueva')?.value;
  const confirmar = control.get('confirmarPassword')?.value;
  return nueva === confirmar ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-cambiar-password',
  imports: [ReactiveFormsModule],
  templateUrl: './cambiar-password.component.html',
  styleUrl: './cambiar-password.component.scss',
})
export class CambiarPasswordComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group(
    {
      passwordActual: ['', [Validators.required]],
      passwordNueva: ['', [Validators.required]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  private readonly cambiarAction = asyncAction(
    (passwordActual: string, passwordNueva: string) => this.authService.cambiarContrasena(passwordActual, passwordNueva),
    {
      onSuccess: () => {
        this.authService.clearSession();
        void this.router.navigate(['/login']);
      },
      defaultErrorMessage: 'No se ha podido cambiar la contraseña.',
    },
  );
  protected readonly guardando = this.cambiarAction.loading;
  protected readonly error = this.cambiarAction.error;

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { passwordActual, passwordNueva } = this.form.getRawValue();
    this.cambiarAction.run(passwordActual, passwordNueva);
  }
}
