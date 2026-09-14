import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-configuracion-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './configuracion-shell.component.html',
  styleUrl: './configuracion-shell.component.scss',
})
export class ConfiguracionShellComponent {
  private readonly authService = inject(AuthService);

  readonly esAdmin = computed(() => this.authService.tieneRol('Administrador'));
}
