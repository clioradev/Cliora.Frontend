import { AbstractControl, FormControl, FormGroup, ValidationErrors, Validators } from '@angular/forms';
import { DatosHijo, TipoUsuario } from '../../../core/auth/usuario.model';
import { tramoPropuesto, tramosPermitidos } from '../../../core/utils/tramo-edad';

export const HIJO_PASSWORD_LONGITUD_MINIMA = 6;
export const MAXIMO_HIJOS = 4;

export type HijoForm = FormGroup<{
  nombre: FormControl<string>;
  fechaNacimiento: FormControl<string>;
  tipoUsuario: FormControl<TipoUsuario>;
  accesoPropio: FormControl<boolean>;
  password: FormControl<string>;
  lecturaAutomatica: FormControl<boolean>;
}>;

/**
 * Formulario de un hijo. <tramoActual> es el tramo que ya tiene al editarlo: se puede conservar
 * aunque la edad ya proponga otro, porque el cambio de tramo no es automático.
 */
export function crearHijoForm(valores?: Partial<DatosHijo>, tramoActual?: TipoUsuario): HijoForm {
  return new FormGroup(
    {
      nombre: new FormControl(valores?.nombre ?? '', { nonNullable: true, validators: [Validators.required, Validators.maxLength(100)] }),
      fechaNacimiento: new FormControl(valores?.fechaNacimiento ?? '', { nonNullable: true, validators: [Validators.required] }),
      tipoUsuario: new FormControl<TipoUsuario>(valores?.tipoUsuario ?? 'Infantil', { nonNullable: true }),
      accesoPropio: new FormControl(!!valores?.password, { nonNullable: true }),
      password: new FormControl(valores?.password ?? '', { nonNullable: true }),
      lecturaAutomatica: new FormControl(valores?.lecturaAutomatica ?? false, { nonNullable: true }),
    },
    { validators: (grupo) => validarHijo(grupo, tramoActual) },
  );
}

function validarHijo(grupo: AbstractControl, tramoActual?: TipoUsuario): ValidationErrors | null {
  const { fechaNacimiento, tipoUsuario, accesoPropio, password } = (grupo as HijoForm).getRawValue();
  const propuesto = tramoPropuesto(fechaNacimiento);
  if (!fechaNacimiento) {
    return null;
  }
  if (propuesto === null) {
    return { fechaFutura: true };
  }
  if (propuesto === 'Adulto') {
    return { mayorDeEdad: true };
  }
  if (tipoUsuario !== tramoActual && !tramosPermitidos(fechaNacimiento).includes(tipoUsuario)) {
    return { tramoNoValido: true };
  }
  if (accesoPropio && tipoUsuario === 'Juvenil' && password.length < HIJO_PASSWORD_LONGITUD_MINIMA) {
    return { passwordCorta: true };
  }
  return null;
}

/** Datos para el API. Sin acceso propio (o si es infantil) la contraseña va vacía. */
export function datosDeHijoForm(grupo: HijoForm): DatosHijo {
  const v = grupo.getRawValue();
  return {
    nombre: v.nombre.trim(),
    fechaNacimiento: v.fechaNacimiento,
    tipoUsuario: v.tipoUsuario,
    password: v.accesoPropio && v.tipoUsuario === 'Juvenil' ? v.password : null,
    lecturaAutomatica: v.lecturaAutomatica,
  };
}
