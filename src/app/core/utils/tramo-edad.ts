import { TipoUsuario } from '../auth/usuario.model';

/**
 * Tramos por edad, espejo de TramoEdad del back: infantil hasta los 7 años, juvenil de 8 a 17 y
 * adulto desde los 18. Un infantil se puede subir a juvenil; nunca a adulto.
 */
export const EDAD_JUVENIL = 8;
export const EDAD_ADULTA = 18;

/** Textos para el usuario: en la interfaz no se usan «Kid» ni «Junior». */
export const NOMBRE_TRAMO: Record<TipoUsuario, string> = {
  Infantil: 'Infantil (hasta 7 años)',
  Juvenil: 'Juvenil (de 8 a 17 años)',
  Adulto: 'Adulto',
};

/** Fecha 'yyyy-MM-dd' de un input type="date" → edad hoy; null si no hay fecha válida. */
export function edad(fecha: string | null | undefined, hoy = new Date()): number | null {
  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return null;
  }
  const [anio, mes, dia] = fecha.split('-').map(Number);
  let anios = hoy.getFullYear() - anio;
  if (hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia)) {
    anios--;
  }
  return anios;
}

export function tramoPropuesto(fecha: string | null | undefined): TipoUsuario | null {
  const anios = edad(fecha);
  if (anios === null || anios < 0) {
    return null;
  }
  return anios < EDAD_JUVENIL ? 'Infantil' : anios < EDAD_ADULTA ? 'Juvenil' : 'Adulto';
}

/** Tramos que se pueden elegir para un hijo con esa fecha; vacío si es mayor de edad o no hay fecha. */
export function tramosPermitidos(fecha: string | null | undefined): TipoUsuario[] {
  const propuesto = tramoPropuesto(fecha);
  return propuesto === 'Infantil' ? ['Infantil', 'Juvenil'] : propuesto === 'Juvenil' ? ['Juvenil'] : [];
}

/** Hoy como 'yyyy-MM-dd' (hora local), para el atributo max de los input type="date". */
export function hoyIso(): string {
  const hoy = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${hoy.getFullYear()}-${dos(hoy.getMonth() + 1)}-${dos(hoy.getDate())}`;
}
