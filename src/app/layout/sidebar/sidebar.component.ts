import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly abierto = input(false);
  readonly cerrar = output<void>();

  protected onNavegar(): void {
    this.cerrar.emit();
  }

  protected onLogout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.cerrar.emit();
        void this.router.navigate(['/login']);
      },
      error: () => {
        this.authService.clearSession();
        this.cerrar.emit();
        void this.router.navigate(['/login']);
      },
    });
  }
}
