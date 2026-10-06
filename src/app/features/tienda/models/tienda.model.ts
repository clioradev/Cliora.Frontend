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
  /** Progreso (%) a partir del cual una aventura deja de poder devolverse. */
  umbralDevolucion: number;
  /** El pago es ficticio (entorno de pruebas sin pasarela). */
  pagoSimulado: boolean;
}

export interface CompraRealizada {
  idCompra: number;
  total: number;
}
