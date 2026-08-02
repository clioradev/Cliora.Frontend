export interface Preferencias {
  tema: number;
  tipografia: number;
  tamanoFuente: number;
  espaciadoLineas: number;
  anchoLectura: number;
  intensidadFondo: number;
  altoContraste: boolean;
  reducirAnimaciones: boolean;
}

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
