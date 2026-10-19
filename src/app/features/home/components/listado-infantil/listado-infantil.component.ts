import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { concatMap } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { Aventura, Universo } from '../../models/universo.model';
import { DesbloquearModalComponent } from '../desbloquear-modal/desbloquear-modal.component';

/** Aventura terminada que se quiere volver a leer. */
interface VolverALeer {
  aventura: Aventura;
  /** Hay aventuras posteriores de la campaña con avance, que el reinicio borra. */
  pierdePosteriores: boolean;
}

type EstadoInfantil = 'jugable' | 'terminada' | 'candado' | 'espera';

/**
 * Listado de los perfiles infantiles: sin buscador ni textos largos, solo carátulas grandes. Al tocar
 * un universo se ven sus campañas y aventuras con imagen; las que se pueden jugar, iluminadas, y las
 * que esperan a la suscripción, con un candado infantil.
 */
@Component({
  selector: 'app-listado-infantil',
  imports: [DesbloquearModalComponent, ModalComponent],
  templateUrl: './listado-infantil.component.html',
  styleUrl: './listado-infantil.component.scss',
})
export class ListadoInfantilComponent {
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);

  readonly universos = input.required<Universo[]>();
  /** Se ha desbloqueado algo: hay que recargar el listado. */
  readonly cambiado = output<void>();

  private readonly idUniversoAbierto = signal<number | null>(null);
  protected readonly universoAbierto = computed(
    () => this.universos().find((u) => u.idUniverso === this.idUniversoAbierto()) ?? null,
  );

  protected readonly desbloqueando = signal(false);
  /** Aventura que espera a la anterior: se le da un aviso breve en vez de no hacer nada. */
  protected readonly avisoEspera = signal<number | null>(null);

  protected abrir(universo: Universo): void {
    this.idUniversoAbierto.set(universo.idUniverso);
    this.avisoEspera.set(null);
  }

  protected volver(): void {
    this.idUniversoAbierto.set(null);
  }

  /** La carátula del universo; si no tiene, la de su primera aventura. */
  protected portada(universo: Universo): string | null {
    return universo.imagenUrl ?? universo.campanas.flatMap((c) => c.aventuras).find((a) => a.caratulaUrl)?.caratulaUrl ?? null;
  }

  protected estado(aventura: Aventura): EstadoInfantil {
    if (aventura.requiereSuscripcion) {
      return 'candado';
    }
    if (aventura.estadoPartida === 'Finalizada') {
      return 'terminada';
    }
    return aventura.estadoPartida !== null || aventura.puedeEmpezarPartida ? 'jugable' : 'espera';
  }

  // Sin pasar por la portada: la que está a medias sigue donde se quedó y la nueva empieza ya. La
  // terminada (o abandonada) pregunta antes, porque volver a leerla borra su partida.
  protected tocar(aventura: Aventura): void {
    switch (this.estado(aventura)) {
      case 'candado':
        this.desbloqueando.set(true);
        break;
      case 'espera':
        this.avisoEspera.set(aventura.idAventura);
        break;
      default:
        if (aventura.estadoPartida === 'En curso' && aventura.idNodoActual) {
          this.irAPartida(aventura.idNodoActual, aventura);
        } else if (aventura.estadoPartida !== null) {
          this.volverALeer.set({ aventura, pierdePosteriores: this.tienePosterioresConAvance(aventura) });
        } else if (aventura.idVersionAventura) {
          this.empezarAction.run(aventura, false);
        }
    }
  }

  protected readonly volverALeer = signal<VolverALeer | null>(null);

  private readonly empezarAction = asyncAction(
    (aventura: Aventura, reiniciar: boolean) => {
      const empezar = this.partidaService.empezar(aventura.idVersionAventura!);
      return reiniciar
        ? this.partidaService.reiniciarAventura(aventura.idAventura).pipe(concatMap(() => empezar))
        : empezar;
    },
    {
      onSuccess: (respuesta, aventura) => {
        this.volverALeer.set(null);
        this.irAPartida(respuesta.idNodoActual, aventura);
      },
      defaultErrorMessage: 'No se ha podido abrir la aventura.',
    },
  );
  protected readonly empezando = this.empezarAction.loading;
  protected readonly errorEmpezar = this.empezarAction.error;

  protected confirmarVolverALeer(): void {
    const volver = this.volverALeer();
    if (volver?.aventura.idVersionAventura) {
      this.empezarAction.run(volver.aventura, true);
    }
  }

  private irAPartida(idNodo: number, aventura: Aventura): void {
    void this.router.navigate(['/partida', idNodo], { queryParams: { idAventura: aventura.idAventura } });
  }

  private tienePosterioresConAvance(aventura: Aventura): boolean {
    const campana = this.universoAbierto()?.campanas.find((c) => c.aventuras.includes(aventura));
    const posteriores = campana?.aventuras.slice(campana.aventuras.indexOf(aventura) + 1) ?? [];
    return posteriores.some((a) => a.estadoPartida !== null);
  }

  protected onDesbloqueado(): void {
    this.cambiado.emit();
  }
}
