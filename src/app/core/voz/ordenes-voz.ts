// Órdenes del modo manos libres. Para elegir hace falta decir «elijo» delante del ordinal («elijo la
// primera»): así ni la respiración ni el ruido ni una frase suelta eligen nada por error.

export type OrdenVoz =
  | { tipo: 'opcion'; numero: number }
  | { tipo: 'continuar' }
  | { tipo: 'repetir' }
  | { tipo: 'finalizar' }
  /** Ha dicho «elijo» pero no se entiende qué. */
  | { tipo: 'no-entendida' };

export const ORDINALES = ['primera', 'segunda', 'tercera', 'cuarta', 'quinta', 'sexta', 'séptima', 'octava'];

const NUMERO_POR_PALABRA: Record<string, number> = {
  primera: 1, primero: 1, uno: 1, una: 1,
  segunda: 2, segundo: 2, dos: 2,
  tercera: 3, tercero: 3, tres: 3,
  cuarta: 4, cuarto: 4, cuatro: 4,
  quinta: 5, quinto: 5, cinco: 5,
  sexta: 6, sexto: 6, seis: 6,
  septima: 7, septimo: 7, siete: 7,
  octava: 8, octavo: 8, ocho: 8,
};

/** Interpreta la frase oída (con sus alternativas); null si no es una orden. */
export function interpretarOrden(alternativas: string[]): OrdenVoz | null {
  let resultado: OrdenVoz | null = null;

  for (const alternativa of alternativas) {
    const texto = normalizar(alternativa);

    const eleccion = texto.match(/\b(?:elijo|eligo)\b(?:\s+(?:la|el|opcion))*\s*(\S*)/);
    if (eleccion) {
      // «1ª», «1.ª», «2a»… se quedan en el número.
      const palabra = eleccion[1].replace(/^(\d+)\.?[ao]?$/, '$1');
      const numero = NUMERO_POR_PALABRA[palabra] ?? (/^\d+$/.test(palabra) ? Number(palabra) : null);
      if (numero) {
        return { tipo: 'opcion', numero };
      }
      if (/^(continuar|siguiente)$/.test(palabra)) {
        return { tipo: 'continuar' };
      }
      resultado ??= { tipo: 'no-entendida' };
      continue;
    }

    if (/\b(continuar|continua|siguiente)\b/.test(texto)) {
      return { tipo: 'continuar' };
    }
    if (/\b(repetir|repite)\b/.test(texto)) {
      return { tipo: 'repetir' };
    }
    if (/\bfinalizar\b/.test(texto)) {
      return { tipo: 'finalizar' };
    }
  }

  return resultado;
}

function normalizar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[ªº]/g, '')
    .replace(/[¡!¿?,;:]/g, ' ')
    .replace(/\.(?!\d)/g, ' ')
    .trim();
}
