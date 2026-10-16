// Contenido del carrito: solo ids. El precio siempre lo calcula el servidor (Tienda/Presupuesto).
export interface Carrito {
  idsAventura: number[];
  idsCampana: number[];
}

export interface LineaPresupuesto {
  idAventura: number;
  tituloAventura: string;
  idCampana: number;
  tituloCampana: string;
  porCampana: boolean;
  precioBase: number;
  descuento: number;
  descuentoCampana: number;
  importe: number;
  /** Sale a 0 € porque se paga con una de las aventuras gratis del usuario. */
  esGratuitaPorCredito: boolean;
}

export interface ElementoRechazado {
  idAventura: number | null;
  idCampana: number | null;
  motivo: string;
}

export interface Presupuesto {
  lineas: LineaPresupuesto[];
  rechazados: ElementoRechazado[];
  total: number;
  /** Aventuras gratis que tiene el usuario antes de comprar. */
  aventurasGratisDisponibles: number;
  /** Cuántas de ellas se gastan en este carrito. */
  aventurasGratisUsadas: number;
  /** Progreso (%) a partir del cual una aventura deja de poder devolverse. */
  umbralDevolucion: number;
  /** El pago es ficticio (entorno de pruebas sin pasarela). */
  pagoSimulado: boolean;
}

export interface CompraRealizada {
  idCompra: number;
  total: number;
}
