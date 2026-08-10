import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
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

  private readonly universosResource = rxResource({
    stream: () => this.universoService.getUniversos(),
  });
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);
  protected readonly aventura = computed<Aventura | null>(() => {
    const universos = this.universosResource.value();
    if (!universos) {
      return null;
    }
    const aventuras = universos.flatMap((u) => u.campanas.flatMap((c) => c.aventuras));
    return aventuras.find((a) => a.idAventura === this.idAventura) ?? null;
  });

  protected readonly notFound = computed(() => !this.loading() && !this.error() && this.aventura() === null);

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
  }

  private readonly empezarAction = asyncAction((aventura: Aventura) => this.partidaService.empezar(aventura.idVersionAventura!), {
    onSuccess: (respuesta, aventura) =>
      void this.router.navigate(['/partida', respuesta.idNodoActual], {
        queryParams: { idAventura: aventura.idAventura },
      }),
    defaultErrorMessage: 'No se ha podido empezar la partida.',
  });
  protected readonly starting = this.empezarAction.loading;
  protected readonly startError = this.empezarAction.error;

  protected empezarPartida(): void {
    const aventura = this.aventura();
    if (!aventura?.idVersionAventura) {
      return;
    }
    this.empezarAction.run(aventura);
  }
}
