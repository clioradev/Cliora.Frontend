import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmarPassword = control.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-restablecer-contrasena',
  imports: [ReactiveFormsModule],
  templateUrl: './restablecer-contrasena.component.html',
  styleUrl: './restablecer-contrasena.component.scss',
})
export class RestablecerContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly token = computed(() => this.queryParamMap().get('token'));

  protected readonly form = this.fb.nonNullable.group(
    {
      password: ['', [Validators.required]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  private readonly restablecerAction = asyncAction(
    (token: string, nuevaPassword: string) => this.authService.restablecerContrasena(token, nuevaPassword),
    {
      onSuccess: () => void this.router.navigate(['/login']),
      defaultErrorMessage: 'El enlace no es válido o ha caducado.',
    },
  );
  protected readonly submitting = this.restablecerAction.loading;
  protected readonly error = this.restablecerAction.error;

  protected onSubmit(): void {
    const token = this.token();
    if (this.form.invalid || !token) {
      return;
    }

    const { password } = this.form.getRawValue();
    this.restablecerAction.run(token, password);
  }
}
