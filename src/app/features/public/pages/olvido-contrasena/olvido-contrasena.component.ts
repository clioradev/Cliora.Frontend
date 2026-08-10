import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';

@Component({
  selector: 'app-olvido-contrasena',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './olvido-contrasena.component.html',
  styleUrl: './olvido-contrasena.component.scss',
})
export class OlvidoContrasenaComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  private readonly enviarAction = asyncAction((email: string) => this.authService.olvidoContrasena(email), {
    defaultErrorMessage: 'No se ha podido procesar la solicitud.',
  });
  protected readonly submitting = this.enviarAction.loading;
  protected readonly error = this.enviarAction.error;
  protected readonly enviado = this.enviarAction.success;

  protected onSubmit(): void {
    if (this.form.invalid) {
      return;
    }

    const { email } = this.form.getRawValue();
    this.enviarAction.run(email);
  }
}
