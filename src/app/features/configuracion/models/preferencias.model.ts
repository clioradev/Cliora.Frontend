export interface Preferencias {
  tema: number;
  tipografia: number;
  tamanoFuente: number;
  espaciadoLineas: number;
  anchoLectura: number;
  intensidadFondo: number;
  altoContraste: boolean;
  reducirAnimaciones: boolean;
  /** Al entrar en un nodo, empieza a leerlo en voz alta a los 2 segundos. */
  lecturaAutomatica: boolean;
  /** Lee el nodo y sus opciones y escucha la elección por voz («Elijo la primera»). */
  manosLibres: boolean;
  /** Velocidad de la lectura en voz alta, en % de la normal del navegador. */
  velocidadLectura: number;
  /** Solo llega del servidor (lectura): el tutorial de bienvenida ya se ha visto o saltado. */
  tutorialVisto?: boolean;
}

export const VELOCIDAD_LECTURA_OPCIONES: OpcionEnum[] = [
  { valor: 60, etiqueta: 'Muy lenta' },
  { valor: 75, etiqueta: 'Lenta' },
  { valor: 85, etiqueta: 'Pausada' },
  { valor: 100, etiqueta: 'Normal (por defecto)' },
  { valor: 115, etiqueta: 'Rápida' },
  { valor: 130, etiqueta: 'Muy rápida' },
];

export interface OpcionEnum {
  valor: number;
  etiqueta: string;
}

export const TEMA_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Claro' },
  { valor: 2, etiqueta: 'Oscuro' },
  { valor: 3, etiqueta: 'Sistema' },
];

export const TIPOGRAFIA_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Predeterminada' },
  { valor: 2, etiqueta: 'Serif' },
  { valor: 3, etiqueta: 'Monoespaciada' },
  { valor: 4, etiqueta: 'Futurista' },
  { valor: 5, etiqueta: 'Medieval' },
  { valor: 6, etiqueta: 'Máquina de escribir' },
];

export const TAMANO_FUENTE_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Pequeño' },
  { valor: 2, etiqueta: 'Mediano' },
  { valor: 3, etiqueta: 'Grande' },
  { valor: 4, etiqueta: 'Extra grande' },
];

export const ESPACIADO_LINEAS_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Compacto' },
  { valor: 2, etiqueta: 'Normal' },
  { valor: 3, etiqueta: 'Amplio' },
];

export const ANCHO_LECTURA_OPCIONES: OpcionEnum[] = [
  { valor: 1, etiqueta: 'Estrecho' },
  { valor: 2, etiqueta: 'Normal' },
  { valor: 3, etiqueta: 'Ancho' },
];
