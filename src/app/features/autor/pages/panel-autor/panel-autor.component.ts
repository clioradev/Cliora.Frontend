import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { CampanaFormModalComponent } from '../../components/campana-form-modal/campana-form-modal.component';
import { UniversoFormModalComponent } from '../../components/universo-form-modal/universo-form-modal.component';
import { AutorService } from '../../data-access/autor.service';
import { CampanaAutor, UniversoAutor } from '../../models/autor.model';

interface CampanaModalState {
  idUniverso: number;
  campana: CampanaAutor | null;
}

@Component({
  selector: 'app-panel-autor',
  imports: [RouterLink, UniversoFormModalComponent, CampanaFormModalComponent],
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
}
