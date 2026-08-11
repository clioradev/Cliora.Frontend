import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { PartidaService } from '../../data-access/partida.service';
import { Aventura, Campana, Universo } from '../../models/universo.model';
import { ReiniciarAventuraModalComponent } from '../reiniciar-aventura-modal/reiniciar-aventura-modal.component';
import { ResenasModalComponent } from '../resenas-modal/resenas-modal.component';
import { ValoracionModalComponent } from '../valoracion-modal/valoracion-modal.component';

@Component({
  selector: 'app-aventura-detalle',
  imports: [RouterLink, StarRatingDisplayComponent, ResenasModalComponent, ValoracionModalComponent, ReiniciarAventuraModalComponent],
  templateUrl: './aventura-detalle.component.html',
  styleUrl: './aventura-detalle.component.scss',
})
export class AventuraDetalleComponent {
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);

  readonly aventura = input.required<Aventura>();
  readonly campana = input.required<Campana>();
  readonly universo = input.required<Universo>();

  readonly cambiado = output<void>();

  protected readonly categorias = computed(() => this.universo().tipos.join(', '));

  protected readonly opinionesAbiertas = signal(false);
  protected readonly valorando = signal(false);
  protected readonly reiniciando = signal(false);

  protected hueCaratula(aventura: Aventura): number {
    return (aventura.idAventura * 47) % 360;
  }

  protected duracionTexto(minutos: number): string {
    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;
    if (horas === 0) {
      return `${resto} min`;
    }
    return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`;
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
    if (!aventura.idVersionAventura) {
      return;
    }
    this.empezarAction.run(aventura);
  }

  protected verValoraciones(): void {
    this.opinionesAbiertas.set(true);
  }

  protected valorarAventura(): void {
    this.valorando.set(true);
  }

  protected onValoracionCerrada(): void {
    this.valorando.set(false);
    this.cambiado.emit();
  }

  protected reiniciarAventura(): void {
    this.reiniciando.set(true);
  }

  protected onReiniciarCerrado(): void {
    this.reiniciando.set(false);
  }

  protected onAventuraReiniciada(): void {
    this.reiniciando.set(false);
    this.cambiado.emit();
  }
}
