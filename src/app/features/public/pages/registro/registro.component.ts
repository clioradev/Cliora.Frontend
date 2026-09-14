import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { passwordComplejidadValidator } from '../../../../core/validators/password-complejidad.validator';
import { asyncAction } from '../../../../core/utils/async-action';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmarPassword = control.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordsDistintas: true };
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, passwordComplejidadValidator]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  private readonly registroAction = asyncAction(
    (nombre: string, email: string, password: string) => this.authService.register(nombre, email, password),
    {
      onSuccess: (_usuario, _nombre, email) =>
        void this.router.navigate(['../confirmar-registro'], { relativeTo: this.route, queryParams: { email } }),
      defaultErrorMessage: 'No se ha podido completar el registro.',
    },
  );
  protected readonly submitting = this.registroAction.loading;
  protected readonly error = this.registroAction.error;

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { nombre, email, password } = this.form.getRawValue();
    this.registroAction.run(nombre, email, password);
  }
}
