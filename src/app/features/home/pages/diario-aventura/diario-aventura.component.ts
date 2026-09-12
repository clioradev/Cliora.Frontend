import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura } from '../../models/universo.model';

@Component({
  selector: 'app-diario-aventura',
  imports: [RouterLink],
  templateUrl: './diario-aventura.component.html',
  styleUrl: './diario-aventura.component.scss',
})
export class DiarioAventuraComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly universoService = inject(UniversoService);
  private readonly partidaService = inject(PartidaService);

  private readonly idAventura = Number(this.route.snapshot.paramMap.get('idAventura'));

  private readonly universosResource = rxResource({
    stream: () => this.universoService.getUniversos(),
  });
  protected readonly loadingAventura = this.universosResource.isLoading;
  protected readonly errorAventura = computed(() => this.universosResource.error() !== undefined);

  protected readonly aventura = computed<Aventura | null>(() => {
    const universos = this.universosResource.value();
    if (!universos) {
      return null;
    }
    for (const universo of universos) {
      for (const campana of universo.campanas) {
        const aventura = campana.aventuras.find((a) => a.idAventura === this.idAventura);
        if (aventura) {
          return aventura;
        }
      }
    }
    return null;
  });

  protected readonly notFound = computed(() => !this.loadingAventura() && !this.errorAventura() && this.aventura() === null);

  private readonly diarioResource = rxResource({
    stream: () => this.partidaService.obtenerDiario(this.idAventura),
  });
  protected readonly bloques = this.diarioResource.value;
  protected readonly loadingDiario = this.diarioResource.isLoading;
  protected readonly errorDiario = computed(() => this.diarioResource.error() !== undefined);

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
  }
}
