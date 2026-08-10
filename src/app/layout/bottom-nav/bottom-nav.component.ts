import { Component, computed, inject } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PartidaService } from '../../features/home/data-access/partida.service';

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
})
export class BottomNavComponent {
  private readonly authService = inject(AuthService);
  private readonly partidaService = inject(PartidaService);
  private readonly router = inject(Router);

  private readonly navegacion = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => Date.now()),
    ),
    { initialValue: 0 },
  );

  private readonly continuarResource = rxResource({
    params: () => (this.authService.isAuthenticated() ? { tick: this.navegacion() } : undefined),
    stream: () => this.partidaService.obtenerContinuar(),
  });

  protected readonly continuarDestino = computed(() => this.continuarResource.value() ?? null);
  protected readonly mostrarAutor = computed(() => this.authService.tieneRol('Autor'));

  protected onContinuar(): void {
    const destino = this.continuarDestino();
    if (!destino) {
      return;
    }
    void this.router.navigate(['/partida', destino.idNodo], { queryParams: { idAventura: destino.idAventura } });
  }
}
