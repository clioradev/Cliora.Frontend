import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { ResenaDetalleModalComponent } from '../../components/resena-detalle-modal/resena-detalle-modal.component';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura, Universo } from '../../models/universo.model';
import { UltimaValoracion } from '../../models/valoracion.model';

@Component({
  selector: 'app-universo-list',
  imports: [RouterLink, StarRatingDisplayComponent, ResenaDetalleModalComponent, ValoracionModalComponent],
  templateUrl: './universo-list.component.html',
  styleUrl: './universo-list.component.scss',
})
export class UniversoListComponent {
  private readonly universoService = inject(UniversoService);
  private readonly partidaService = inject(PartidaService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly universos = signal<Universo[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly startingAventuraId = signal<number | null>(null);
  protected readonly startError = signal<string | null>(null);

  protected readonly resenaAbierta = signal<UltimaValoracion | null>(null);
  protected readonly idAventuraAValorar = signal<number | null>(null);

  constructor() {
    this.cargarUniversos();
  }

  protected empezarPartida(aventura: Aventura): void {
    if (!aventura.idVersionAventura || this.startingAventuraId() !== null) {
      return;
    }

    this.startingAventuraId.set(aventura.idAventura);
    this.startError.set(null);

    this.partidaService.empezar(aventura.idVersionAventura).subscribe({
      next: (respuesta) => {
        this.startingAventuraId.set(null);
        void this.router.navigate(['/partida', respuesta.idNodoActual], {
          queryParams: { idAventura: aventura.idAventura },
        });
      },
      error: () => {
        this.startingAventuraId.set(null);
        this.startError.set('No se ha podido empezar la partida.');
      },
    });
  }

  protected verResena(valoracion: UltimaValoracion): void {
    this.resenaAbierta.set(valoracion);
  }

  protected valorarAventura(idAventura: number): void {
    this.idAventuraAValorar.set(idAventura);
  }

  protected onValoracionCerrada(): void {
    this.idAventuraAValorar.set(null);
    this.cargarUniversos();
  }

  private cargarUniversos(): void {
    this.universoService
      .getUniversos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (universos) => {
          this.universos.set(universos);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
