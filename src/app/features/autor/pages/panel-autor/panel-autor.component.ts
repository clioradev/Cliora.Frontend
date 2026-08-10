import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { CampanaFormModalComponent } from '../../components/campana-form-modal/campana-form-modal.component';
import { UniversoFormModalComponent } from '../../components/universo-form-modal/universo-form-modal.component';
import { AutorService } from '../../data-access/autor.service';
import { AventuraAutor, CampanaAutor, UniversoAutor } from '../../models/autor.model';

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
  imports: [RouterLink, UniversoFormModalComponent, CampanaFormModalComponent, ConfirmarEliminarModalComponent],
  templateUrl: './panel-autor.component.html',
  styleUrl: './panel-autor.component.scss',
})
export class PanelAutorComponent {
  private readonly autorService = inject(AutorService);

  private readonly universosResource = rxResource({
    stream: () => this.autorService.getUniversos(),
    defaultValue: [] as UniversoAutor[],
  });
  protected readonly universos = this.universosResource.value;
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);

  protected readonly universoModal = signal<UniversoAutor | 'nuevo' | null>(null);
  protected readonly campanaModal = signal<CampanaModalState | null>(null);
  protected readonly eliminarModal = signal<EliminarModalState | null>(null);

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
