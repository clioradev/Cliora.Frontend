import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

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

  protected readonly submitting = signal(false);
  protected readonly errors = signal<string[]>([]);

  protected readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      confirmarPassword: ['', [Validators.required]],
    },
    { validators: passwordsIgualesValidator },
  );

  protected onSubmit(): void {
    if (this.form.invalid || this.submitting()) {
      return;
    }

    this.submitting.set(true);
    this.errors.set([]);

    const { nombre, email, password } = this.form.getRawValue();

    this.authService.register(nombre, email, password).subscribe({
      next: () => {
        this.submitting.set(false);
        void this.router.navigate(['/login']);
      },
      error: (err: { error?: string[] }) => {
        this.submitting.set(false);
        this.errors.set(err.error ?? ['No se ha podido completar el registro.']);
      },
    });
  }
}
