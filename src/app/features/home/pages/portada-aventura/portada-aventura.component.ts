import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AventuraDetalleComponent } from '../../components/aventura-detalle/aventura-detalle.component';
import { UniversoService } from '../../data-access/universo.service';
import { Aventura, Campana, Universo } from '../../models/universo.model';

interface ContextoAventura {
  universo: Universo;
  campana: Campana;
  aventura: Aventura;
}

@Component({
  selector: 'app-portada-aventura',
  imports: [RouterLink, AventuraDetalleComponent],
  templateUrl: './portada-aventura.component.html',
  styleUrl: './portada-aventura.component.scss',
})
export class PortadaAventuraComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly universoService = inject(UniversoService);

  private readonly idAventura = Number(this.route.snapshot.paramMap.get('idAventura'));

  private readonly universosResource = rxResource({
    stream: () => this.universoService.getUniversos(),
  });
  protected readonly loading = this.universosResource.isLoading;
  protected readonly error = computed(() => this.universosResource.error() !== undefined);

  protected readonly contexto = computed<ContextoAventura | null>(() => {
    const universos = this.universosResource.value();
    if (!universos) {
      return null;
    }
    for (const universo of universos) {
      for (const campana of universo.campanas) {
        const aventura = campana.aventuras.find((a) => a.idAventura === this.idAventura);
        if (aventura) {
          return { universo, campana, aventura };
        }
      }
    }
    return null;
  });

  protected readonly notFound = computed(() => !this.loading() && !this.error() && this.contexto() === null);

  protected recargar(): void {
    this.universosResource.reload();
  }
}
