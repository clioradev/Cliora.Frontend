import { Component, effect, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PreferenciasAplicadasService } from '../../features/configuracion/data-access/preferencias-aplicadas.service';
import { BottomNavComponent } from '../bottom-nav/bottom-nav.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, BottomNavComponent],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent {
  protected readonly authService = inject(AuthService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);

  constructor() {
    // Sin sesión (p. ej. tras cerrar sesión) se vuelve al tema oscuro por
    // defecto, también para los modales que cuelgan del <body>.
    effect(() => {
      if (!this.authService.isAuthenticated()) {
        this.preferenciasAplicadas.restablecer();
      }
    });
  }
}
