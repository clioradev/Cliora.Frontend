import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { of } from 'rxjs';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AutorService } from '../../../autor/data-access/autor.service';
import { PartidaService } from '../../data-access/partida.service';
import { UniversoService } from '../../data-access/universo.service';
import { BloqueDiario } from '../../models/partida.model';

interface AventuraDiarioCabecera {
  idAventura: number;
  titulo: string;
  caratulaUrl?: string | null;
  esLibro: boolean;
}

@Component({
  selector: 'app-diario-aventura',
  imports: [RouterLink],
  templateUrl: './diario-aventura.component.html',
  styleUrl: './diario-aventura.component.scss',
})
export class DiarioAventuraComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly universoService = inject(UniversoService);
  private readonly autorService = inject(AutorService);
  private readonly partidaService = inject(PartidaService);

  private readonly idAventura = Number(this.route.snapshot.paramMap.get('idAventura'));
  // Modo previsualización (autor probando un libro en borrador, aún no publicado ni visible en el
  // listado público): se carga la aventura vía el endpoint del autor en vez del listado público.
  protected readonly preview = this.route.snapshot.queryParamMap.get('preview') === 'true';

  private readonly universosResource = rxResource({
    stream: () => (this.preview ? of(null) : this.universoService.getUniversos()),
  });

  private readonly aventuraAutorResource = rxResource({
    stream: () => (this.preview ? this.autorService.getAventura(this.idAventura) : of(null)),
  });

  protected readonly loadingAventura = computed(
    () => this.universosResource.isLoading() || this.aventuraAutorResource.isLoading(),
  );
  protected readonly errorAventura = computed(
    () => this.universosResource.error() !== undefined || this.aventuraAutorResource.error() !== undefined,
  );

  protected readonly aventura = computed<AventuraDiarioCabecera | null>(() => {
    if (this.preview) {
      const aventura = this.aventuraAutorResource.value();
      return aventura
        ? { idAventura: aventura.idAventura, titulo: aventura.titulo, caratulaUrl: aventura.caratulaUrl, esLibro: aventura.esLibro }
        : null;
    }

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

  // Un bloque abre "capítulo" (escena) o "parte" (acto) nuevos cuando su escena/acto es distinto del
  // bloque anterior - incluido el primer bloque de todos, que siempre abre los dos.
  protected esInicioDeActo(bloque: BloqueDiario, indice: number): boolean {
    const bloques = this.bloques();
    return indice === 0 || bloque.idActo !== bloques?.[indice - 1]?.idActo;
  }

  protected esInicioDeEscena(bloque: BloqueDiario, indice: number): boolean {
    const bloques = this.bloques();
    return indice === 0 || bloque.idEscena !== bloques?.[indice - 1]?.idEscena;
  }

  protected hueCaratula(aventura: { idAventura: number }): number {
    return (aventura.idAventura * 47) % 360;
  }

  protected volver(): void {
    if (this.preview) {
      this.autorService.detenerPrevisualizacion(this.idAventura).subscribe();
      void this.router.navigate(['/autor/aventura', this.idAventura], { queryParams: { tab: 'contenido' } });
      return;
    }
    void this.router.navigate(['/']);
  }
}
