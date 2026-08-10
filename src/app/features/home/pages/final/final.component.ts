import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';

@Component({
  selector: 'app-final',
  imports: [ValoracionModalComponent],
  templateUrl: './final.component.html',
  styleUrl: './final.component.scss',
})
export class FinalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);

  private readonly idFinal = Number(this.route.snapshot.paramMap.get('idFinal'));

  private readonly finalResource = rxResource({
    stream: () => this.partidaService.getFinal(this.idFinal),
  });
  protected readonly final = this.finalResource.value;
  protected readonly loading = this.finalResource.isLoading;
  protected readonly error = computed(() => this.finalResource.error() !== undefined);

  protected readonly idAventuraFinalizada = signal<number | null>(null);

  private readonly finalizarAction = asyncAction(() => this.partidaService.finalizarAventura(this.idFinal), {
    onSuccess: (respuesta) => this.idAventuraFinalizada.set(respuesta.idAventura),
    defaultErrorMessage: 'No se ha podido finalizar la aventura.',
  });
  protected readonly finalizando = this.finalizarAction.loading;
  protected readonly finalizarError = this.finalizarAction.error;

  protected finalizarAventura(): void {
    this.finalizarAction.run();
  }

  protected onValoracionCerrada(): void {
    void this.router.navigate(['/']);
  }
}
