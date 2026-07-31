import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura, Universo } from '../../models/universo.model';

@Component({
  selector: 'app-universo-list',
  imports: [RouterLink],
  templateUrl: './universo-list.component.html',
  styleUrl: './universo-list.component.scss',
})
export class UniversoListComponent {
  private readonly universoService = inject(UniversoService);
  private readonly partidaService = inject(PartidaService);
  private readonly router = inject(Router);

  protected readonly universos = signal<Universo[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly startingAventuraId = signal<number | null>(null);
  protected readonly startError = signal<string | null>(null);

  constructor() {
    this.universoService
      .getUniversos()
      .pipe(takeUntilDestroyed())
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

  protected empezarPartida(aventura: Aventura): void {
    if (!aventura.idVersionAventura || this.startingAventuraId() !== null) {
      return;
    }

    this.startingAventuraId.set(aventura.idAventura);
    this.startError.set(null);

    this.partidaService.empezar(aventura.idVersionAventura).subscribe({
      next: (respuesta) => {
        this.startingAventuraId.set(null);
        void this.router.navigate(['/partida', respuesta.idNodoActual]);
      },
      error: () => {
        this.startingAventuraId.set(null);
        this.startError.set('No se ha podido empezar la partida.');
      },
    });
  }
}
