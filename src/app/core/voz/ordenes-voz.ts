// Órdenes del modo manos libres. Para elegir se dice «elijo» delante del ordinal («elijo la primera»);
// también vale una frase muy corta que acabe en el ordinal («la primera», «opción dos»), porque el
// reconocedor a veces entiende mal el verbo. Así ni el ruido ni una frase suelta eligen nada por error.

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

// «Elijo» y lo que el reconocedor suele entender en su lugar («hijo», «eligió», «exijo»…).
const VERBO_ELEGIR = '(?:elijo|eligo|elijio|eligio|elige|escojo|escoge|hijo|exijo|elio)';
// Palabras de relleno entre el verbo y el ordinal: «elijo a la opción número uno».
const RELLENO = '(?:\\s+(?:a|la|el|opcion|numero))*';

/** Interpreta la frase oída (con sus alternativas); null si no es una orden. */
export function interpretarOrden(alternativas: string[]): OrdenVoz | null {
  let resultado: OrdenVoz | null = null;

  for (const alternativa of alternativas) {
    const texto = normalizar(alternativa);

    const eleccion = texto.match(new RegExp(`\\b${VERBO_ELEGIR}\\b${RELLENO}\\s*(\\S*)`));
    if (eleccion) {
      const numero = numeroDe(eleccion[1]);
      if (numero) {
        return { tipo: 'opcion', numero };
      }
      if (/^(continuar|siguiente)$/.test(eleccion[1])) {
        return { tipo: 'continuar' };
      }
      resultado ??= { tipo: 'no-entendida' };
      continue;
    }

    // Frase corta que acaba en un ordinal con artículo o «opción» delante («la primera», «opción dos»,
    // o el verbo mal entendido: «hijo la primera»). Al ser tan corta, no la dispara una frase suelta.
    const corta = texto.match(/^(?:\S+\s+)?(?:la|el|opcion|numero)(?:\s+(?:opcion|numero))?\s+(\S+)$/);
    const numeroCorta = corta ? numeroDe(corta[1]) : null;
    if (numeroCorta) {
      return { tipo: 'opcion', numero: numeroCorta };
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

function numeroDe(palabra: string): number | null {
  // «1ª», «1.ª», «2a»… se quedan en el número.
  const limpia = palabra.replace(/^(\d+)\.?[ao]?$/, '$1');
  return NUMERO_POR_PALABRA[limpia] ?? (/^\d+$/.test(limpia) ? Number(limpia) : null);
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
