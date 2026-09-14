import { AbstractControl, ValidationErrors } from '@angular/forms';

export const PASSWORD_LONGITUD_MINIMA = 8;

export function passwordComplejidadValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string | null;
  if (!value) {
    return null; // Validators.required ya cubre el caso vacío
  }

  const errores: ValidationErrors = {};
  if (value.length < PASSWORD_LONGITUD_MINIMA) {
    errores['longitud'] = true;
  }
  if (!/[A-Z]/.test(value)) {
    errores['mayuscula'] = true;
  }
  if (!/[a-z]/.test(value)) {
    errores['minuscula'] = true;
  }
  if (!/\d/.test(value)) {
    errores['numero'] = true;
  }

  return Object.keys(errores).length > 0 ? { passwordDebil: errores } : null;
}
