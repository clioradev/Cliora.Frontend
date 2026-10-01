import { Component, computed, effect, ElementRef, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { PartidaService } from '../../features/home/data-access/partida.service';

interface OpcionMas {
  texto: string;
  ruta: string;
}

const OPCIONES_USUARIO: OpcionMas[] = [
  { texto: 'Cliora', ruta: '/cliora' },
  { texto: '¿Te gusta escribir?', ruta: '/escribir' },
  { texto: 'Preferencias', ruta: '/configuracion/preferencias' },
  { texto: 'Contraseña', ruta: '/configuracion/contrasena' },
];

// Van bajo el título "Administración" del desplegable, por eso sin el prefijo "Admin:".
const OPCIONES_ADMIN: OpcionMas[] = [
  { texto: 'Aventuras', ruta: '/admin/aventuras' },
  { texto: 'Roles', ruta: '/admin/roles' },
  { texto: 'Tipos de universo', ruta: '/admin/tipos-universo' },
  { texto: 'Eliminar aventuras', ruta: '/admin/eliminar-aventuras' },
];

@Component({
  selector: 'app-bottom-nav',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './bottom-nav.component.html',
  styleUrl: './bottom-nav.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'cerrarMenu()',
  },
})
export class BottomNavComponent {
  private readonly authService = inject(AuthService);
  private readonly partidaService = inject(PartidaService);
  private readonly router = inject(Router);
  private readonly elementRef = inject(ElementRef<HTMLElement>);

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

  protected readonly opcionesUsuario = OPCIONES_USUARIO;
  protected readonly opcionesAdmin = computed(() => (this.authService.tieneRol('Administrador') ? OPCIONES_ADMIN : []));

  protected readonly menuAbierto = signal(false);
  protected readonly masActivo = computed(() => {
    this.navegacion();
    const url = this.router.url;
    return ['/cliora', '/escribir', '/configuracion', '/admin'].some((ruta) => url.startsWith(ruta));
  });

  constructor() {
    // Cualquier navegación (elegir una opción, el botón atrás...) cierra el desplegable.
    effect(() => {
      this.navegacion();
      this.menuAbierto.set(false);
    });
  }

  protected onContinuar(): void {
    const destino = this.continuarDestino();
    if (!destino) {
      return;
    }
    void this.router.navigate(['/partida', destino.idNodo], { queryParams: { idAventura: destino.idAventura } });
  }

  protected toggleMenu(): void {
    this.menuAbierto.update((abierto) => !abierto);
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  protected onDocumentClick(evento: MouseEvent): void {
    const mas = (this.elementRef.nativeElement as HTMLElement).querySelector('.bottom-nav__mas');
    if (this.menuAbierto() && mas && !mas.contains(evento.target as Node)) {
      this.cerrarMenu();
    }
  }

  protected cerrarSesion(): void {
    this.cerrarMenu();
    this.authService.logout().subscribe({
      next: () => void this.router.navigate(['/bienvenida']),
      error: () => {
        this.authService.clearSession();
        void this.router.navigate(['/bienvenida']);
      },
    });
  }
}
