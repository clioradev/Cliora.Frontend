import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { NivelValoracion, ResenasModalComponent } from '../../components/resenas-modal/resenas-modal.component';
import { ReiniciarAventuraModalComponent } from '../../components/reiniciar-aventura-modal/reiniciar-aventura-modal.component';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura, CANTIDAD_DECISION_OPCIONES, Campana, Universo } from '../../models/universo.model';

@Component({
  selector: 'app-universo-list',
  imports: [
    RouterLink,
    StarRatingDisplayComponent,
    ResenasModalComponent,
    ValoracionModalComponent,
    ReiniciarAventuraModalComponent,
  ],
  templateUrl: './universo-list.component.html',
  styleUrl: './universo-list.component.scss',
})
export class UniversoListComponent {
  private readonly universoService = inject(UniversoService);

  private readonly universosResource = rxResource({
    stream: () => this.universoService.getUniversos(),
    defaultValue: [] as Universo[],
  });
  protected readonly universos = this.universosResource.value;
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);

  protected readonly opinionesAbiertas = signal<{ nivel: NivelValoracion; id: number; titulo: string } | null>(null);
  protected readonly idAventuraAValorar = signal<number | null>(null);
  protected readonly idAventuraAReiniciar = signal<number | null>(null);

  protected readonly searchTerm = signal('');
  protected readonly selectedTags = signal(new Set<string>());
  protected readonly selectedCantidadDecision = signal<number | null>(null);
  protected readonly cantidadDecisionOpciones = CANTIDAD_DECISION_OPCIONES;

  private readonly indicesAventura = signal(new Map<number, number>());
  private readonly aventurasVolteadas = signal(new Set<number>());

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

    return this.universos()
      .filter((universo) => tags.size === 0 || universo.tipos.some((tag) => tags.has(tag)))
      .map((universo) => this.filtrarUniverso(universo, termino, cantidadDecision))
      .filter((universo): universo is Universo => universo !== null);
  });

  protected aventuraActual(campana: Campana): Aventura {
    return campana.aventuras[this.indiceActual(campana)];
  }

  protected hayAnterior(campana: Campana): boolean {
    return this.indiceActual(campana) > 0;
  }

  protected haySiguiente(campana: Campana): boolean {
    return this.indiceActual(campana) < campana.aventuras.length - 1;
  }

  protected aventuraAnterior(campana: Campana): void {
    this.establecerIndice(campana, this.indiceActual(campana) - 1);
  }

  protected aventuraSiguiente(campana: Campana): void {
    this.establecerIndice(campana, this.indiceActual(campana) + 1);
  }

  protected irAIndice(campana: Campana, indice: number): void {
    this.establecerIndice(campana, indice);
  }

  protected indiceActual(campana: Campana): number {
    const guardado = this.indicesAventura().get(campana.idCampana);
    if (guardado !== undefined && guardado >= 0 && guardado < campana.aventuras.length) {
      return guardado;
    }
    return this.indiceInicial(campana);
  }

  protected estaVolteada(aventura: Aventura): boolean {
    return this.aventurasVolteadas().has(aventura.idAventura);
  }

  protected voltear(aventura: Aventura): void {
    const set = new Set(this.aventurasVolteadas());
    if (set.has(aventura.idAventura)) {
      set.delete(aventura.idAventura);
    } else {
      set.add(aventura.idAventura);
    }
    this.aventurasVolteadas.set(set);
  }

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
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

  protected onSearchInput(event: Event): void {
    this.searchTerm.set((event.target as HTMLInputElement).value);
  }

  protected onCantidadDecisionChange(event: Event): void {
    const valor = (event.target as HTMLSelectElement).value;
    this.selectedCantidadDecision.set(valor === '' ? null : Number(valor));
  }

  protected verOpiniones(nivel: NivelValoracion, id: number, titulo: string): void {
    this.opinionesAbiertas.set({ nivel, id, titulo });
  }

  protected valorarAventura(idAventura: number): void {
    this.idAventuraAValorar.set(idAventura);
  }

  protected onValoracionCerrada(): void {
    this.idAventuraAValorar.set(null);
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
    this.universosResource.reload();
  }

  private establecerIndice(campana: Campana, indice: number): void {
    if (indice < 0 || indice >= campana.aventuras.length) {
      return;
    }

    const mapa = new Map(this.indicesAventura());
    mapa.set(campana.idCampana, indice);
    this.indicesAventura.set(mapa);
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
