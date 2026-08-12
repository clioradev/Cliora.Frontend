export enum EnumOperacionCondicion {
  Igual = 1,
  Distinto = 2,
  Mayor = 3,
  MayorOIgual = 4,
  Menor = 5,
  MenorOIgual = 6,
}

export enum EnumOperacionEfecto {
  Sumar = 1,
  Establecer = 2,
  AnadirEvento = 3,
  EliminarEvento = 4,
}

export interface NodoAutorResumen {
  idNodo: number;
  codigo: string;
  titulo: string;
  cantidadOpciones: number;
}

export interface EscenaAutor {
  idEscena: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  nodos: NodoAutorResumen[];
}

export interface ActoAutor {
  idActo: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  escenas: EscenaAutor[];
}

export interface AventuraAutor {
  idAventura: number;
  titulo: string;
  descripcion: string | null;
  orden: number;
  cantidadDecision: number;
  rutaImagen: string | null;
  visible: boolean;
  duracion: number | null;
  actos: ActoAutor[];
}

export interface CampanaAutor {
  idCampana: number;
  titulo: string;
  descripcion: string | null;
  aventuras: AventuraAutor[];
}

export interface UniversoAutor {
  idUniverso: number;
  titulo: string;
  descripcion: string | null;
  campanas: CampanaAutor[];
}

export interface GuardarUniversoRequest {
  titulo: string;
  descripcion: string | null;
}

export interface GuardarCampanaRequest {
  titulo: string;
  descripcion: string | null;
}

export interface GuardarAventuraRequest {
  titulo: string;
  descripcion: string | null;
  orden: number;
  cantidadDecision: number;
  rutaImagen: string | null;
  duracion: number | null;
}

export interface GuardarActoRequest {
  titulo: string;
  descripcion: string | null;
}

export interface GuardarEscenaRequest {
  titulo: string;
  descripcion: string | null;
}

export interface CrearNodoRequest {
  titulo: string;
}

export interface ContenidoNodoAutor {
  orden: number;
  texto: string;
  gruposCondicion: GrupoCondicionAutor[];
}

export interface CondicionAutor {
  idCondicion: number;
  idCaracteristica: number | null;
  idEvento: number | null;
  operacion: EnumOperacionCondicion;
  valor: number;
}

export interface GrupoCondicionAutor {
  idGrupoCondicion: number;
  condiciones: CondicionAutor[];
}

export interface EfectoAutor {
  idEfecto: number;
  idCaracteristica: number | null;
  idEvento: number | null;
  operacionEfecto: EnumOperacionEfecto;
  valor: number | null;
}

export interface ResultadoAutor {
  idResultado: number;
  idNodoDestino: number | null;
  idFinal: number | null;
  efectos: EfectoAutor[];
}

export interface OpcionArbol {
  idOpcion: number;
  texto: string;
  gruposCondicion: GrupoCondicionAutor[];
  idCaracteristicaTirada: number | null;
  dificultad: number | null;
  resultado: ResultadoAutor | null;
  resultadoFracaso: ResultadoAutor | null;
}

export interface FinalAutor {
  idFinal: number;
  codigo: string;
  titulo: string;
  texto: string;
}

export interface NodoArbol {
  idNodo: number;
  codigo: string;
  titulo: string;
  esNodoInicial: boolean;
  contenidos: ContenidoNodoAutor[];
  opciones: OpcionArbol[];
  nodosDisponibles: NodoAutorResumen[];
  finalesDisponibles: FinalAutor[];
}

export interface CaracteristicaAutor {
  idCaracteristica: number;
  idCatTipoCaracteristica: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  valorInicial: number;
  visible: boolean;
}

export interface CatTipoCaracteristicaAutor {
  idCatTipoCaracteristica: number;
  nombre: string;
  descripcion: string | null;
}

export interface EventoAutor {
  idEvento: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
}

export interface GuardarEventoRequest {
  nombre: string;
  descripcion: string | null;
}

export interface GuardarContenidoNodoRequest {
  orden: number;
  texto: string;
  gruposCondicion: GuardarGrupoCondicionRequest[];
}

export interface GuardarCondicionRequest {
  idCaracteristica: number | null;
  idEvento: number | null;
  operacion: EnumOperacionCondicion;
  valor: number;
}

export interface GuardarGrupoCondicionRequest {
  condiciones: GuardarCondicionRequest[];
}

export interface GuardarEfectoRequest {
  idCaracteristica: number | null;
  idEvento: number | null;
  operacionEfecto: EnumOperacionEfecto;
  valor: number | null;
}

export interface GuardarResultadoRequest {
  idNodoDestino: number | null;
  idFinal: number | null;
  efectos: GuardarEfectoRequest[];
}

export interface GuardarOpcionRequest {
  texto: string;
  gruposCondicion: GuardarGrupoCondicionRequest[];
  idCaracteristicaTirada: number | null;
  dificultad: number | null;
  resultado: GuardarResultadoRequest;
  resultadoFracaso: GuardarResultadoRequest | null;
}

export interface GuardarNodoArbolRequest {
  titulo: string;
  contenidos: GuardarContenidoNodoRequest[];
  opciones: GuardarOpcionRequest[];
}

export interface GuardarFinalRequest {
  titulo: string;
  texto: string;
}

export interface GuardarCaracteristicaRequest {
  idCatTipoCaracteristica: number;
  nombre: string;
  descripcion: string | null;
  valorInicial: number;
  visible: boolean;
}
