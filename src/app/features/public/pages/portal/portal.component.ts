import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-portal',
  imports: [RouterLink, RouterOutlet],
  templateUrl: './portal.component.html',
  styleUrl: './portal.component.scss',
})
export class PortalComponent {
  private readonly router = inject(Router);

  protected readonly modalAbierto = signal(false);

  protected cerrarModal(): void {
    void this.router.navigateByUrl('/bienvenida');
  }
}
