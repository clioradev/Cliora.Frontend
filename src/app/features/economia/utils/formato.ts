const EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });
const NUMERO = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 2 });
const MESES = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function euros(valor: number | null | undefined): string {
  return EUROS.format(valor ?? 0);
}

export function numero(valor: number | null | undefined): string {
  return NUMERO.format(valor ?? 0);
}

export function porcentaje(valor: number | null | undefined): string {
  return valor === null || valor === undefined ? '—' : `${NUMERO.format(valor)} %`;
}

/** «noviembre de 2026». */
export function nombreMes(anio: number, mes: number): string {
  return MESES.format(new Date(Date.UTC(anio, mes - 1, 1)));
}

/** «12 min 30 s». */
export function duracion(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return minutos > 0 ? `${minutos} min ${resto} s` : `${resto} s`;
}

/** Valor «AAAA-MM» de un <input type="month">. */
export function valorMes(anio: number, mes: number): string {
  return `${anio}-${String(mes).padStart(2, '0')}`;
}

export function leerMes(valor: string): { anio: number; mes: number } | null {
  const partes = /^(\d{4})-(\d{2})$/.exec(valor);
  return partes ? { anio: Number(partes[1]), mes: Number(partes[2]) } : null;
}

/** Lee un número escrito con coma o punto; null si no es válido. */
export function leerNumero(texto: string): number | null {
  const limpio = texto.trim().replace(',', '.');
  return limpio !== '' && /^\d+(\.\d+)?$/.test(limpio) ? Number(limpio) : null;
}
