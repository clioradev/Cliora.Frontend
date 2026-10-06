import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { MultiSelectComponent } from '../../../../shared/components/multi-select/multi-select.component';
import { TextoRecortadoComponent } from '../../../../shared/components/texto-recortado/texto-recortado.component';
import { AnchoObservadoDirective } from '../../../../shared/directives/ancho-observado.directive';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { CarritoService } from '../../../tienda/data-access/carrito.service';
import { AventuraDetalleComponent } from '../../components/aventura-detalle/aventura-detalle.component';
import { ReiniciarAventuraModalComponent } from '../../components/reiniciar-aventura-modal/reiniciar-aventura-modal.component';
import { NivelValoracion, ResenasModalComponent } from '../../components/resenas-modal/resenas-modal.component';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import {
  Aventura,
  CANTIDAD_DECISION_OPCIONES,
  Campana,
  ORDEN_UNIVERSOS_OPCIONES,
  OrdenUniversos,
  Universo,
} from '../../models/universo.model';

// Medidas de la estantería en rem (deben coincidir con universo-list.component.scss): ancho preferido
// del libro abierto, ancho de un lomo y separación entre elementos.
const ANCHO_LIBRO_ABIERTO_REM = 29;
const ANCHO_LOMO_REM = 2.75;
const SEPARACION_REM = 0.5;
// En móvil los lomos se apilan en vertical; ahí no manda el ancho sino no alargar demasiado la lista.
const LOMOS_MAXIMOS_MOVIL = 4;
const ANCHO_TABLET_PX = 768;

interface ContextoAventura {
  universo: Universo;
  campana: Campana;
  aventura: Aventura;
}

@Component({
  selector: 'app-universo-list',
  imports: [
    RouterLink,
    ResenasModalComponent,
    AventuraDetalleComponent,
    ReiniciarAventuraModalComponent,
    ValoracionModalComponent,
    MultiSelectComponent,
    TextoRecortadoComponent,
    AnchoObservadoDirective,
    PrecioPipe,
  ],
  templateUrl: './universo-list.component.html',
  styleUrl: './universo-list.component.scss',
})
export class UniversoListComponent {
  private readonly universoService = inject(UniversoService);
  private readonly partidaService = inject(PartidaService);
  protected readonly carrito = inject(CarritoService);

  private readonly universosResource = rxResource({
    stream: () => this.universoService.getUniversos(),
    defaultValue: [] as Universo[],
  });
  protected readonly universos = this.universosResource.value;
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);

  protected readonly opinionesAbiertas = signal<{ nivel: NivelValoracion; id: number; titulo: string } | null>(null);
  protected readonly idAventuraAReiniciar = signal<number | null>(null);
  protected readonly idAventuraAValorar = signal<number | null>(null);

  // Misma fuente que el "Continuar" del menú inferior (Partida/Continuar): la aventura con la
  // decisión más reciente, no la primera "En curso" que aparezca en el listado.
  private readonly continuarResource = rxResource({
    stream: () => this.partidaService.obtenerContinuar(),
  });

  protected readonly aventuraEnCurso = computed<ContextoAventura | null>(() => {
    const idAventura = this.continuarResource.value()?.idAventura;
    if (idAventura === undefined) {
      return null;
    }
    for (const universo of this.universos()) {
      for (const campana of universo.campanas) {
        const aventura = campana.aventuras.find((a) => a.idAventura === idAventura);
        if (aventura) {
          return { universo, campana, aventura };
        }
      }
    }
    return null;
  });

  protected readonly searchTerm = signal('');
  protected readonly selectedTags = signal(new Set<string>());
  protected readonly selectedCantidadDecision = signal<number | null>(null);
  protected readonly cantidadDecisionOpciones = CANTIDAD_DECISION_OPCIONES;
  protected readonly orden = signal<OrdenUniversos>('reciente');
  protected readonly ordenOpciones = ORDEN_UNIVERSOS_OPCIONES;

  private readonly indicesAventura = signal(new Map<number, number>());
  private readonly anchosEstanteria = signal(new Map<number, number>());

  protected readonly availableTags = computed(() => {
    const tags = new Set<string>();
    for (const universo of this.universos()) {
      for (const tag of universo.tipos) {
        tags.add(tag);
      }
    }
    return Array.from(tags).sort();
  });

  protected readonly filteredUniversos = computed(() => {
    const termino = this.searchTerm().trim().toLocaleLowerCase();
    const tags = this.selectedTags();
    const cantidadDecision = this.selectedCantidadDecision();

    // Se ordena antes de filtrar para que el orden dependa del universo completo y no de las
    // aventuras que deje ver el filtro.
    return this.ordenarUniversos(this.universos(), this.orden())
      .filter((universo) => tags.size === 0 || universo.tipos.some((tag) => tags.has(tag)))
      .map((universo) => this.filtrarUniverso(universo, termino, cantidadDecision))
      .filter((universo): universo is Universo => universo !== null);
  });

  protected aventuraActual(campana: Campana): Aventura {
    return campana.aventuras[this.indiceActual(campana)];
  }

  protected irAIndice(campana: Campana, indice: number): void {
    this.establecerIndice(campana, indice);
  }

  protected irAAventura(campana: Campana, aventura: Aventura): void {
    const indice = campana.aventuras.findIndex((a) => a.idAventura === aventura.idAventura);
    if (indice !== -1) {
      this.irAIndice(campana, indice);
    }
  }

  protected aventurasAnteriores(campana: Campana): Aventura[] {
    const indice = this.indiceActual(campana);
    return campana.aventuras.slice(indice - this.repartoLomos(campana).anteriores, indice);
  }

  protected aventurasSiguientes(campana: Campana): Aventura[] {
    const indice = this.indiceActual(campana);
    return campana.aventuras.slice(indice + 1, indice + 1 + this.repartoLomos(campana).siguientes);
  }

  protected onAnchoEstanteria(campana: Campana, ancho: number): void {
    if (this.anchosEstanteria().get(campana.idCampana) === ancho) {
      return;
    }
    const mapa = new Map(this.anchosEstanteria());
    mapa.set(campana.idCampana, ancho);
    this.anchosEstanteria.set(mapa);
  }

  protected indiceActual(campana: Campana): number {
    const guardado = this.indicesAventura().get(campana.idCampana);
    if (guardado !== undefined && guardado >= 0 && guardado < campana.aventuras.length) {
      return guardado;
    }
    return this.indiceInicial(campana);
  }

  // Una aventura continúa la anterior: si la anterior (que no sea un libro) también está bloqueada
  // y no va en el carrito, se añade con ella. Los libros se compran sueltos.
  protected anadirAventuraAlCarrito(campana: Campana, aventura: Aventura): void {
    let anadidas = 0;
    if (!aventura.esLibro) {
      const indice = campana.aventuras.findIndex((a) => a.idAventura === aventura.idAventura);
      for (const anterior of campana.aventuras.slice(0, indice)) {
        if (anterior.bloqueada && !anterior.esLibro && !this.carrito.contieneAventura(anterior.idAventura)) {
          this.carrito.anadirAventura(anterior.idAventura);
          anadidas++;
        }
      }
    }
    this.carrito.anadirAventura(aventura.idAventura);
    this.carrito.avisar(anadidas > 0 ? '¡Aventuras añadidas!' : '¡Aventura añadida!');
  }

  protected anadirCampanaAlCarrito(campana: Campana): void {
    // La campaña ya incluye sus aventuras sueltas: se quitan para no mostrarlas dos veces.
    for (const aventura of campana.aventuras) {
      this.carrito.quitarAventura(aventura.idAventura);
    }
    this.carrito.anadirCampana(campana.idCampana);
    this.carrito.avisar('¡Campaña añadida!');
  }

  // Una aventura también está "en el carrito" si va dentro de su campaña entera.
  protected enCarrito(campana: Campana, aventura: Aventura): boolean {
    return this.carrito.contieneCampana(campana.idCampana) || this.carrito.contieneAventura(aventura.idAventura);
  }

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
  }

  // Estado de juego de la aventura (independiente de si es un libro): verde si se puede jugar o
  // continuar (incluye "Abandonada", que se puede reiniciar), rojo si hay que completar antes las
  // aventuras anteriores de la campaña, azul si ya está finalizada.
  protected estadoAventura(aventura: Aventura): 'jugable' | 'bloqueada' | 'finalizada' {
    if (aventura.estadoPartida === 'Finalizada') {
      return 'finalizada';
    }
    if (aventura.estadoPartida !== null || aventura.puedeEmpezarPartida) {
      return 'jugable';
    }
    return 'bloqueada';
  }

  protected toggleTag(tag: string): void {
    const set = new Set(this.selectedTags());
    if (set.has(tag)) {
      set.delete(tag);
    } else {
      set.add(tag);
    }
    this.selectedTags.set(set);
  }

  protected clearTags(): void {
    this.selectedTags.set(new Set<string>());
  }

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onCantidadDecisionChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.selectedCantidadDecision.set(valor === '' ? null : Number(valor));
  }

  protected onOrdenChange(event: Event): void {
    this.orden.set((event.target as HTMLSelectElement).value as OrdenUniversos);
  }

  protected verOpiniones(nivel: NivelValoracion, id: number, titulo: string): void {
    this.opinionesAbiertas.set({ nivel, id, titulo });
  }

  protected recargarUniversos(): void {
    this.universosResource.reload();
  }

  protected reiniciarAventura(idAventura: number): void {
    this.idAventuraAReiniciar.set(idAventura);
  }

  protected onReiniciarCerrado(): void {
    this.idAventuraAReiniciar.set(null);
  }

  protected onAventuraReiniciada(): void {
    this.idAventuraAReiniciar.set(null);
    this.recargarUniversos();
  }

  protected valorarAventura(idAventura: number): void {
    this.idAventuraAValorar.set(idAventura);
  }

  protected onValoracionCerrada(): void {
    this.idAventuraAValorar.set(null);
  }

  // Cuántos lomos caben junto al libro abierto y cómo se reparten: primero a partes iguales a cada
  // lado y, si en un lado no hay tantas aventuras, el sitio sobrante se da al otro lado.
  private repartoLomos(campana: Campana): { anteriores: number; siguientes: number } {
    const indice = this.indiceActual(campana);
    const disponiblesAntes = indice;
    const disponiblesDespues = campana.aventuras.length - 1 - indice;

    const huecos = this.huecosLomos(campana);
    let anteriores = Math.min(disponiblesAntes, Math.floor(huecos / 2));
    const siguientes = Math.min(disponiblesDespues, huecos - anteriores);
    anteriores = Math.min(disponiblesAntes, huecos - siguientes);
    return { anteriores, siguientes };
  }

  private huecosLomos(campana: Campana): number {
    if (window.innerWidth <= ANCHO_TABLET_PX) {
      return LOMOS_MAXIMOS_MOVIL;
    }

    const ancho = this.anchosEstanteria().get(campana.idCampana);
    if (ancho === undefined) {
      return LOMOS_MAXIMOS_MOVIL;
    }

    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const libre = ancho - ANCHO_LIBRO_ABIERTO_REM * rem;
    return Math.max(0, Math.floor(libre / ((ANCHO_LOMO_REM + SEPARACION_REM) * rem)));
  }

  private establecerIndice(campana: Campana, indice: number): void {
    if (indice < 0 || indice >= campana.aventuras.length) {
      return;
    }

    const mapa = new Map(this.indicesAventura());
    mapa.set(campana.idCampana, indice);
    this.indicesAventura.set(mapa);
  }

  // Primero los universos empezados que aún tienen aventuras por terminar; dentro de cada grupo,
  // por el criterio elegido: más reciente (última aventura publicada) o mejor valoración media.
  private ordenarUniversos(universos: Universo[], orden: OrdenUniversos): Universo[] {
    return [...universos].sort((a, b) => {
      const prioridad = Number(this.estaEmpezadoConPendientes(b)) - Number(this.estaEmpezadoConPendientes(a));
      if (prioridad !== 0) {
        return prioridad;
      }

      const criterio =
        orden === 'valoracion'
          ? (b.puntuacionMedia ?? -1) - (a.puntuacionMedia ?? -1)
          : this.marcaTiempo(b.fechaPublicacion) - this.marcaTiempo(a.fechaPublicacion);
      return criterio !== 0 ? criterio : b.idUniverso - a.idUniverso;
    });
  }

  private estaEmpezadoConPendientes(universo: Universo): boolean {
    const aventuras = universo.campanas.flatMap((c) => c.aventuras);
    return (
      aventuras.some((a) => a.estadoPartida !== null) && aventuras.some((a) => a.estadoPartida !== 'Finalizada')
    );
  }

  private marcaTiempo(fecha: string | null): number {
    return fecha ? new Date(fecha).getTime() : 0;
  }

  private filtrarUniverso(universo: Universo, termino: string, cantidadDecision: number | null): Universo | null {
    const campanas: Campana[] = [];
    for (const campana of universo.campanas) {
      const aventuras = campana.aventuras.filter((aventura) =>
        this.aventuraVisible(universo, campana, aventura, termino, cantidadDecision),
      );
      if (aventuras.length === 0) {
        continue;
      }
      campanas.push(aventuras.length === campana.aventuras.length ? campana : { ...campana, aventuras });
    }

    return campanas.length > 0 ? { ...universo, campanas } : null;
  }

  private aventuraVisible(
    universo: Universo,
    campana: Campana,
    aventura: Aventura,
    termino: string,
    cantidadDecision: number | null,
  ): boolean {
    if (cantidadDecision !== null && aventura.cantidadDecision !== cantidadDecision) {
      return false;
    }

    if (!termino) {
      return true;
    }

    return (
      universo.titulo.toLocaleLowerCase().includes(termino) ||
      campana.titulo.toLocaleLowerCase().includes(termino) ||
      aventura.titulo.toLocaleLowerCase().includes(termino)
    );
  }

  private indiceInicial(campana: Campana): number {
    const enCurso = campana.aventuras.findIndex((a) => a.estadoPartida === 'En curso');
    if (enCurso !== -1) {
      return enCurso;
    }

    const jugable = campana.aventuras.findIndex((a) => a.puedeEmpezarPartida);
    if (jugable !== -1) {
      return jugable;
    }

    return Math.max(campana.aventuras.length - 1, 0);
  }
}
