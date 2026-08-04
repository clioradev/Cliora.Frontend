import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura } from '../../models/universo.model';

@Component({
  selector: 'app-portada-aventura',
  imports: [RouterLink, StarRatingDisplayComponent],
  templateUrl: './portada-aventura.component.html',
  styleUrl: './portada-aventura.component.scss',
})
export class PortadaAventuraComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly universoService = inject(UniversoService);
  private readonly partidaService = inject(PartidaService);

  private readonly idAventura = Number(this.route.snapshot.paramMap.get('idAventura'));

  protected readonly aventura = signal<Aventura | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly starting = signal(false);
  protected readonly startError = signal<string | null>(null);

  protected readonly notFound = computed(() => !this.loading() && !this.error() && this.aventura() === null);

  constructor() {
    this.universoService
      .getUniversos()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (universos) => {
          const aventuras = universos.flatMap((u) => u.campanas.flatMap((c) => c.aventuras));
          this.aventura.set(aventuras.find((a) => a.idAventura === this.idAventura) ?? null);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
  }

  protected empezarPartida(): void {
    const aventura = this.aventura();
    if (!aventura?.idVersionAventura || this.starting()) {
      return;
    }

    this.starting.set(true);
    this.startError.set(null);

    this.partidaService.empezar(aventura.idVersionAventura).subscribe({
      next: (respuesta) => {
        this.starting.set(false);
        void this.router.navigate(['/partida', respuesta.idNodoActual], {
          queryParams: { idAventura: aventura.idAventura },
        });
      },
      error: () => {
        this.starting.set(false);
        this.startError.set('No se ha podido empezar la partida.');
      },
    });
  }
}
