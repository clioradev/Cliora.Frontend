/** Bloque económico: el tramo del universo (EnumTipoUsuario en el API). */
export enum Categoria {
  Infantil = 1,
  Juvenil = 2,
  Adulto = 3,
}

export enum EstadoLectura {
  Valida = 1,
  NoRemunerada = 2,
  Invalidada = 3,
}

export enum MotivoLectura {
  Ninguno = 0,
  NoEsPerfilDeHijo = 1,
  SinSuscripcionDePago = 2,
  PruebaGratuita = 3,
  AventuraGratuita = 4,
  ObraPropia = 5,
  LimiteMensual = 6,
  TiempoImposible = 7,
}

export const NOMBRE_CATEGORIA: Record<Categoria, string> = {
  [Categoria.Adulto]: 'Adultos',
  [Categoria.Juvenil]: 'Juvenil',
  [Categoria.Infantil]: 'Infantil',
};

export const NOMBRE_MOTIVO: Record<MotivoLectura, string> = {
  [MotivoLectura.Ninguno]: '',
  [MotivoLectura.NoEsPerfilDeHijo]: 'No es un perfil de hijo',
  [MotivoLectura.SinSuscripcionDePago]: 'Sin suscripción de pago',
  [MotivoLectura.PruebaGratuita]: 'Prueba gratuita',
  [MotivoLectura.AventuraGratuita]: 'Aventura gratuita',
  [MotivoLectura.ObraPropia]: 'Obra de su padre o madre',
  [MotivoLectura.LimiteMensual]: 'Límite de relecturas del mes',
  [MotivoLectura.TiempoImposible]: 'Tiempo imposible',
};

export interface AutorLiquidacion {
  idAutor: number;
  nombre: string;
  email: string | null;
  esCliora: boolean;
  ventas: number;
  devoluciones: number;
  baseNeta: number;
  porcentaje: number;
  puntos: number;
  lecturas: number;
  participacion: number;
  importe: number;
}

export interface CategoriaEconomica {
  categoria: Categoria;
  ingresosBrutos: number;
  devoluciones: number;
  iva: number;
  comisiones: number;
  ingresosNetos: number;
  costePromocion: number;
  porcentajePlataforma: number;
  importePlataforma: number;
  importeAutores: number;
  puntosTotales: number;
  valorPunto: number;
  importeSinRepartir: number;
  totalCliora: number;
  totalAutoresExternos: number;
  autores: AutorLiquidacion[];
}

export interface ResumenEconomico {
  anio: number;
  mes: number;
  cerrado: boolean;
  fechaCierre: string | null;
  sePuedeCerrar: boolean;
  motivoNoSePuedeCerrar: string | null;
  incluyeMesesAnteriores: boolean;
  totalCliora: number;
  totalAutoresExternos: number;
  categorias: CategoriaEconomica[];
}

export interface Periodo {
  anio: number;
  mes: number;
  fechaCierre: string;
  totalCliora: number;
  totalAutoresExternos: number;
  ingresosNetos: number;
}

export interface ContratoAutor {
  idAutor: number;
  nombre: string;
  email: string | null;
  tieneContrato: boolean;
  porcentajeAdulto: number;
  porcentajeIva: number;
  porcentajeIrpf: number;
  esCliora: boolean;
  nombreFiscal: string | null;
  nif: string | null;
  notas: string | null;
  totalLiquidado: number;
  totalPagado: number;
  saldoPendiente: number;
  pendienteDePago: boolean;
}

export interface GuardarContratoRequest {
  porcentajeAdulto: number;
  porcentajeIva: number;
  porcentajeIrpf: number;
  esCliora: boolean;
  nombreFiscal: string | null;
  nif: string | null;
  notas: string | null;
}

export interface RegistrarPagoRequest {
  importe: number;
  fecha: string | null;
  referencia: string | null;
  notas: string | null;
}

export interface PagoAutor {
  idPagoAutor: number;
  idAutor: number;
  nombreAutor: string | null;
  fecha: string;
  importe: number;
  porcentajeIva: number;
  iva: number;
  porcentajeIrpf: number;
  irpf: number;
  importeTransferido: number;
  referencia: string | null;
  notas: string | null;
}

export interface LecturaAdmin {
  idLectura: number;
  fecha: string;
  idLector: number;
  lector: string;
  emailPagador: string | null;
  idAventura: number;
  aventura: string;
  autor: string;
  categoria: Categoria;
  segundosReales: number;
  minutosRemunerados: number;
  puntos: number;
  estado: EstadoLectura;
  motivo: MotivoLectura;
  motivoInvalidacion: string | null;
  liquidada: boolean;
  validasDelPerfilEseDia: number;
}

export interface DuracionAventura {
  idAventura: number;
  universo: string;
  campana: string;
  titulo: string;
  orden: number;
  categoria: Categoria;
  visible: boolean;
  duracion: number | null;
  minutosRemunerados: number | null;
  puntos: number;
}

export interface PropuestaDuracion {
  minutos: number;
  minutosLectura: number;
  palabras: number;
  imagenes: number;
  decisiones: number;
}

export interface AventuraIngresos {
  idAventura: number;
  titulo: string;
  campana: string;
  lecturas: number;
  lecturasValidas: number;
  lectoresUnicos: number;
  relecturas: number;
  lecturasHistoricas: number;
  puntos: number;
  porcentajeFinalizacion: number | null;
  ventas: number;
  devoluciones: number;
  baseNeta: number;
  remuneracion: number;
  valoracionMedia: number | null;
  valoraciones: number;
}

export interface CategoriaIngresosAutor {
  categoria: Categoria;
  remuneracionProvisional: number;
  fondoAutores: number;
  puntosTotales: number;
  valorPunto: number;
  misPuntos: number;
  participacion: number;
  lecturas: number;
  lecturasValidas: number;
  lectoresUnicos: number;
  relecturas: number;
  lecturasHistoricas: number;
  lectoresHistoricos: number;
  porcentaje: number;
  ventas: number;
  devoluciones: number;
  baseNeta: number;
  aventuras: AventuraIngresos[];
}

export interface LiquidacionAutorHistorico {
  anio: number;
  mes: number;
  categoria: Categoria;
  ventas: number;
  devoluciones: number;
  puntos: number;
  lecturas: number;
  valorPunto: number;
  importe: number;
}

export interface PanelIngresosAutor {
  esCliora: boolean;
  porcentajeAdulto: number;
  pagoMinimo: number;
  minutosPorPunto: number;
  porcentajePlataformaSuscripcion: number;
  lecturasRemuneradasMes: number;
  totalLiquidado: number;
  totalPagado: number;
  saldoPendiente: number;
  remuneracionProvisional: number;
  provisionalIncluyeMesesAnteriores: boolean;
  categorias: CategoriaIngresosAutor[];
  historico: LiquidacionAutorHistorico[];
  pagos: PagoAutor[];
}
