import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { filter, map } from 'rxjs';
import { PreferenciasAplicadasService } from '../../features/configuracion/data-access/preferencias-aplicadas.service';
import { PreferenciasService } from '../../features/configuracion/data-access/preferencias.service';
import { AuthService } from '../auth/auth.service';
import { PASOS_TUTORIAL } from './tutorial-pasos';

/**
 * Tutorial de bienvenida: sale solo la primera vez que el usuario llega al listado de universos
 * (`UsuarioConfiguracion.TutorialVisto`). Terminarlo o saltarlo lo marca como visto en el servidor;
 * desde Preferencias se puede repetir.
 */
@Injectable({ providedIn: 'root' })
export class TutorialService {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);
  private readonly preferenciasService = inject(PreferenciasService);

  readonly pasos = PASOS_TUTORIAL;
  readonly indice = signal<number | null>(null);
  readonly paso = computed(() => {
    const indice = this.indice();
    return indice === null ? null : this.pasos[indice];
  });
  readonly esUltimo = computed(() => this.indice() === this.pasos.length - 1);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );

  constructor() {
    effect(() => {
      const toca =
        this.authService.isAuthenticated() &&
        this.preferenciasAplicadas.tutorialVisto() === false &&
        this.url().split('?')[0] === '/';
      if (toca && untracked(this.indice) === null) {
        this.indice.set(0);
      }
    });
  }

  /** Repetirlo a mano (desde Preferencias): empieza en el listado de universos. */
  repetir(): void {
    void this.router.navigate(['/']).then(() => this.indice.set(0));
  }

  /** `navegar` es false cuando ya se ha pulsado el elemento resaltado (él mismo navega). */
  siguiente(navegar = true): void {
    const indice = this.indice();
    if (indice === null) {
      return;
    }

    const ruta = this.pasos[indice].ruta;
    if (navegar && ruta && this.router.url !== ruta) {
      void this.router.navigateByUrl(ruta);
    }

    if (indice + 1 < this.pasos.length) {
      this.indice.set(indice + 1);
    } else {
      this.terminar();
    }
  }

  /** Saltar y terminar cuentan igual: no vuelve a salir. */
  terminar(): void {
    this.indice.set(null);
    if (this.preferenciasAplicadas.tutorialVisto() !== true) {
      this.preferenciasAplicadas.tutorialVisto.set(true);
      this.preferenciasService.marcarTutorialVisto().subscribe({ error: () => undefined });
    }
  }
}
