import { Component, inject, input, OnInit, output, signal } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { GrupoCaracteristica } from '../../models/partida.model';

@Component({
  selector: 'app-ficha-personaje-modal',
  imports: [ModalComponent],
  templateUrl: './ficha-personaje-modal.component.html',
  styleUrl: './ficha-personaje-modal.component.scss',
})
export class FichaPersonajeModalComponent implements OnInit {
  private readonly partidaService = inject(PartidaService);

  readonly idNodo = input.required<number>();
  readonly cerrado = output<void>();

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly grupos = signal<GrupoCaracteristica[]>([]);

  ngOnInit(): void {
    this.partidaService.getPersonaje(this.idNodo()).subscribe({
      next: (personaje) => {
        this.grupos.set(personaje.grupos);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
}
