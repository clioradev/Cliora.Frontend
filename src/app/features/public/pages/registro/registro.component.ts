import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { DatosRegistro } from '../../../../core/auth/usuario.model';
import { passwordComplejidadValidator } from '../../../../core/validators/password-complejidad.validator';
import { asyncAction } from '../../../../core/utils/async-action';
import { EDAD_ADULTA, edad, hoyIso } from '../../../../core/utils/tramo-edad';
import { HijoCamposComponent } from '../../../../shared/components/hijo-campos/hijo-campos.component';
import { crearHijoForm, datosDeHijoForm, HijoForm, MAXIMO_HIJOS } from '../../../../shared/components/hijo-campos/hijo-form';

function passwordsIgualesValidator(control: AbstractControl): ValidationErrors | null {
  const password = control.get('password')?.value;
  const confirmarPassword = control.get('confirmarPassword')?.value;
  return password === confirmarPassword ? null : { passwordsDistintas: true };
}

function mayorDeEdadValidator(control: AbstractControl): ValidationErrors | null {
  const anios = edad(control.value as string);
  if (anios === null) {
    return null; // Validators.required ya cubre el caso vacío
  }
  return anios < 0 || anios > 120 ? { fechaNoValida: true } : anios < EDAD_ADULTA ? { menorDeEdad: true } : null;
}

@Component({
  selector: 'app-registro',
  imports: [ReactiveFormsModule, RouterLink, HijoCamposComponent],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.scss',
})
export class RegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  protected readonly hoy = hoyIso();
  protected readonly maximoHijos = MAXIMO_HIJOS;

  protected readonly form = this.fb.nonNullable.group(
    {
      nombre: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      fechaNacimiento: ['', [Validators.required, mayorDeEdadValidator]],
      password: ['', [Validators.required, passwordComplejidadValidator]],
      confirmarPassword: ['', [Validators.required]],
      hijos: new FormArray<HijoForm>([]),
    },
    { validators: passwordsIgualesValidator },
  );

  protected readonly mostrarHijos = signal(false);

  private readonly registroAction = asyncAction((datos: DatosRegistro) => this.authService.register(datos), {
    onSuccess: (_resultado, datos) =>
      void this.router.navigate(['../confirmar-registro'], { relativeTo: this.route, queryParams: { email: datos.email } }),
    defaultErrorMessage: 'No se ha podido completar el registro.',
  });
  protected readonly submitting = this.registroAction.loading;
  protected readonly error = this.registroAction.error;

  protected get hijos(): FormArray<HijoForm> {
    return this.form.controls.hijos;
  }

  protected abrirHijos(): void {
    this.mostrarHijos.set(true);
    if (this.hijos.length === 0) {
      this.anadirHijo();
    }
  }

  protected anadirHijo(): void {
    if (this.hijos.length < MAXIMO_HIJOS) {
      this.hijos.push(crearHijoForm());
    }
  }

  protected quitarHijo(indice: number): void {
    this.hijos.removeAt(indice);
    if (this.hijos.length === 0) {
      this.mostrarHijos.set(false);
    }
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { nombre, email, password, fechaNacimiento } = this.form.getRawValue();
    this.registroAction.run({ nombre, email, password, fechaNacimiento, hijos: this.hijos.controls.map(datosDeHijoForm) });
  }
}
