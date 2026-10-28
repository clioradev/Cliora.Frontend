import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { CampanaFormModalComponent } from '../../components/campana-form-modal/campana-form-modal.component';
import { TipoAventuraModalComponent } from '../../components/tipo-aventura-modal/tipo-aventura-modal.component';
import { UniversoFormModalComponent } from '../../components/universo-form-modal/universo-form-modal.component';
import { AlertaService } from '../../../alertas/data-access/alerta.service';
import { AventuraConAlertas } from '../../../alertas/models/alerta.model';
import { AutorService } from '../../data-access/autor.service';
import { AventuraAutor, CampanaAutor, CatUniversoEdad, InformeImportacion, UniversoAutor } from '../../models/autor.model';

type TramoFiltro = 'todos' | 'adulto' | 'juvenil' | 'infantil';

interface FiltroPanel {
  texto: string;
  tramo: TramoFiltro;
}

const FILTRO_VACIO: FiltroPanel = { texto: '', tramo: 'todos' };
// En sessionStorage: se conserva al entrar en una aventura y volver, y se olvida al cerrar la pestaña.
const CLAVE_FILTRO = 'panelAutor.filtro';

/** Minúsculas y sin tildes, para que «azogue» encuentre «Azogue» y «lagrimas», «lágrimas». */
function normalizar(texto: string): string {
  return texto.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
}

/** Mismo criterio que etiquetaEdadUniverso: el tramo sale de la edad máxima. */
function tramoDeEdad(edad: CatUniversoEdad): Exclude<TramoFiltro, 'todos'> {
  return edad.edadMaxima < 8 ? 'infantil' : edad.edadMaxima < 18 ? 'juvenil' : 'adulto';
}

function leerFiltro(): FiltroPanel {
  try {
    const raw = sessionStorage.getItem(CLAVE_FILTRO);
    return raw ? { ...FILTRO_VACIO, ...(JSON.parse(raw) as Partial<FiltroPanel>) } : FILTRO_VACIO;
  } catch {
    return FILTRO_VACIO;
  }
}

interface CampanaModalState {
  idUniverso: number;
  campana: CampanaAutor | null;
}

interface EliminarModalState {
  titulo: string;
  mensaje: string;
  accion: () => Observable<void>;
}

@Component({
  selector: 'app-panel-autor',
  imports: [
    RouterLink,
    IconoComponent,
    UniversoFormModalComponent,
    CampanaFormModalComponent,
    ConfirmarEliminarModalComponent,
    TipoAventuraModalComponent,
  ],
  templateUrl: './panel-autor.component.html',
  styleUrl: './panel-autor.component.scss',
})
export class PanelAutorComponent {
  private readonly autorService = inject(AutorService);
  private readonly alertaService = inject(AlertaService);
  private readonly router = inject(Router);

  private readonly universosResource = rxResource({
    stream: () => this.autorService.getUniversos(),
    defaultValue: [] as UniversoAutor[],
  });
  protected readonly universos = this.universosResource.value;
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);

  // Alertas abiertas por aventura (solo las del autor), para el «!» de cada fila.
  private readonly incidenciasResource = rxResource({
    stream: () => this.alertaService.getAventurasConAlertas(),
    defaultValue: [] as AventuraConAlertas[],
  });
  protected readonly alertasPorAventura = computed(
    () => new Map(this.incidenciasResource.value().map((a) => [a.idAventura, a.numeroAlertas])),
  );

  private readonly edadesResource = rxResource({
    stream: () => this.autorService.getCatalogoEdadesUniverso(),
    defaultValue: [] as CatUniversoEdad[],
  });

  protected readonly filtroTexto = signal(leerFiltro().texto);
  protected readonly filtroTramo = signal<TramoFiltro>(leerFiltro().tramo);
  protected readonly hayFiltro = computed(() => this.filtroTexto().trim() !== '' || this.filtroTramo() !== 'todos');

  protected readonly universosFiltrados = computed(() => {
    const texto = normalizar(this.filtroTexto());
    const tramo = this.filtroTramo();
    const tramoPorEdad = new Map(this.edadesResource.value().map((e) => [e.idCatUniversoEdad, tramoDeEdad(e)]));
    return this.universos().filter(
      (u) =>
        (texto === '' || normalizar(u.titulo).includes(texto)) &&
        (tramo === 'todos' || tramoPorEdad.get(u.idCatUniversoEdad) === tramo),
    );
  });

  constructor() {
    effect(() => {
      const filtro: FiltroPanel = { texto: this.filtroTexto(), tramo: this.filtroTramo() };
      try {
        sessionStorage.setItem(CLAVE_FILTRO, JSON.stringify(filtro));
      } catch {
        // Sin almacenamiento (modo privado): el filtro funciona igual, solo no se recuerda.
      }
    });
  }

  protected onFiltroTexto(event: Event): void {
    this.filtroTexto.set((event.target as HTMLInputElement).value);
  }

  protected onFiltroTramo(event: Event): void {
    this.filtroTramo.set((event.target as HTMLSelectElement).value as TramoFiltro);
  }

  protected restablecerFiltro(): void {
    this.filtroTexto.set(FILTRO_VACIO.texto);
    this.filtroTramo.set(FILTRO_VACIO.tramo);
  }

  protected readonly universoModal = signal<UniversoAutor | 'nuevo' | null>(null);
  protected readonly campanaModal = signal<CampanaModalState | null>(null);
  protected readonly eliminarModal = signal<EliminarModalState | null>(null);
  protected readonly tipoAventuraModal = signal<number | null>(null);

  protected nuevaAventura(idCampana: number): void {
    this.tipoAventuraModal.set(idCampana);
  }

  protected cerrarTipoAventuraModal(): void {
    this.tipoAventuraModal.set(null);
  }

  protected onTipoAventuraElegido(esLibro: boolean): void {
    const idCampana = this.tipoAventuraModal();
    this.tipoAventuraModal.set(null);
    if (idCampana === null) {
      return;
    }
    void this.router.navigate(['/autor/aventura/nueva'], { queryParams: { idCampana, esLibro } });
  }

  protected onAventuraImportada(informe: InformeImportacion): void {
    this.tipoAventuraModal.set(null);
    this.universosResource.reload();
    if (informe.idAventura !== null) {
      void this.router.navigate(['/autor/aventura', informe.idAventura]);
    }
  }

  protected nuevoUniverso(): void {
    this.universoModal.set('nuevo');
  }

  protected editarUniverso(universo: UniversoAutor): void {
    this.universoModal.set(universo);
  }

  protected cerrarUniversoModal(): void {
    this.universoModal.set(null);
  }

  protected onUniversoGuardado(): void {
    this.universoModal.set(null);
    this.universosResource.reload();
  }

  protected onTipoActualizado(): void {
    this.universosResource.reload();
  }

  protected nuevaCampana(idUniverso: number): void {
    this.campanaModal.set({ idUniverso, campana: null });
  }

  protected editarCampana(idUniverso: number, campana: CampanaAutor): void {
    this.campanaModal.set({ idUniverso, campana });
  }

  protected cerrarCampanaModal(): void {
    this.campanaModal.set(null);
  }

  protected onCampanaGuardada(): void {
    this.campanaModal.set(null);
    this.universosResource.reload();
  }

  protected eliminarUniverso(universo: UniversoAutor): void {
    const totalCampanas = universo.campanas.length;
    this.eliminarModal.set({
      titulo: `Eliminar universo "${universo.titulo}"`,
      mensaje:
        totalCampanas > 0
          ? `Este universo tiene ${totalCampanas} campaña(s). Se eliminarán también todas sus campañas, aventuras y contenido.`
          : `¿Seguro que quieres eliminar el universo "${universo.titulo}"?`,
      accion: () => this.autorService.eliminarUniverso(universo.idUniverso),
    });
  }

  protected eliminarCampana(campana: CampanaAutor): void {
    const totalAventuras = campana.aventuras.length;
    this.eliminarModal.set({
      titulo: `Eliminar campaña "${campana.titulo}"`,
      mensaje:
        totalAventuras > 0
          ? `Esta campaña tiene ${totalAventuras} aventura(s). Se eliminarán también todas sus aventuras y su contenido.`
          : `¿Seguro que quieres eliminar la campaña "${campana.titulo}"?`,
      accion: () => this.autorService.eliminarCampana(campana.idCampana),
    });
  }

  // El endpoint espera la lista completa de aventuras de la campaña en el orden deseado (igual que
  // reordenar actos o escenas), así que se intercambian los dos ids afectados y se manda entera.
  protected moverAventura(campana: CampanaAutor, aventura: AventuraAutor, direccion: -1 | 1): void {
    const index = campana.aventuras.findIndex((a) => a.idAventura === aventura.idAventura);
    const destino = index + direccion;
    if (destino < 0 || destino >= campana.aventuras.length) {
      return;
    }

    const ids = campana.aventuras.map((a) => a.idAventura);
    [ids[index], ids[destino]] = [ids[destino], ids[index]];
    this.autorService
      .reordenarAventuras(campana.idCampana, ids)
      .subscribe(() => this.universosResource.reload());
  }

  protected eliminarAventura(aventura: AventuraAutor): void {
    this.eliminarModal.set({
      titulo: `Eliminar aventura "${aventura.titulo}"`,
      mensaje: `Se eliminará la aventura "${aventura.titulo}" y, si tiene, todos sus actos y escenas.`,
      accion: () => this.autorService.eliminarAventura(aventura.idAventura),
    });
  }

  protected cerrarEliminarModal(): void {
    this.eliminarModal.set(null);
  }

  protected onEliminado(): void {
    this.eliminarModal.set(null);
    this.universosResource.reload();
  }
}
