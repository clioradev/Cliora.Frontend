import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Aventura, Universo } from '../../models/universo.model';
import { DesbloquearModalComponent } from '../desbloquear-modal/desbloquear-modal.component';

type EstadoInfantil = 'jugable' | 'terminada' | 'candado' | 'espera';

/**
 * Listado de los perfiles infantiles: sin buscador ni textos largos, solo carátulas grandes. Al tocar
 * un universo se ven sus campañas y aventuras con imagen; las que se pueden jugar, iluminadas, y las
 * que esperan a la suscripción, con un candado infantil.
 */
@Component({
  selector: 'app-listado-infantil',
  imports: [DesbloquearModalComponent],
  templateUrl: './listado-infantil.component.html',
  styleUrl: './listado-infantil.component.scss',
})
export class ListadoInfantilComponent {
  private readonly router = inject(Router);

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

  protected tocar(aventura: Aventura): void {
    switch (this.estado(aventura)) {
      case 'candado':
        this.desbloqueando.set(true);
        break;
      case 'espera':
        this.avisoEspera.set(aventura.idAventura);
        break;
      default:
        void this.router.navigate(['/aventura', aventura.idAventura, 'portada']);
    }
  }

  protected onDesbloqueado(): void {
    this.cambiado.emit();
  }
}
