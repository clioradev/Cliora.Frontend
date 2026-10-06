/**
 * Lee un importe en € escrito por el administrador ("1,99", "1.99", "2"). Vacío = null.
 * Devuelve undefined si no es un número válido con como mucho dos decimales.
 */
export function leerImporte(texto: string): number | null | undefined {
  const limpio = texto.trim().replace(',', '.');
  if (limpio === '') {
    return null;
  }
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) {
    return undefined;
  }
  return Number(limpio);
}

/** Importe para un campo de texto: 1.99 -> "1,99"; null -> "". */
export function escribirImporte(valor: number | null): string {
  return valor === null ? '' : valor.toFixed(2).replace('.', ',');
}
