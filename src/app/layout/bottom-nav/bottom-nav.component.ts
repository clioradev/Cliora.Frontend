import { Component, computed, DestroyRef, effect, ElementRef, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { AlertaService } from '../../features/alertas/data-access/alerta.service';
import { PartidaService } from '../../features/home/data-access/partida.service';
import { CarritoService } from '../../features/tienda/data-access/carrito.service';

const DURACION_BURBUJA_MS = 2500;

interface OpcionMas {
  texto: string;
  ruta: string;
}

const OPCIONES_USUARIO: OpcionMas[] = [
  { texto: 'Cliora', ruta: '/cliora' },
  { texto: '¿Te gusta escribir?', ruta: '/escribir' },
  { texto: 'Mi cuenta', ruta: '/configuracion/cuenta' },
  { texto: 'Mis compras', ruta: '/compras' },
  { texto: 'Preferencias', ruta: '/configuracion/preferencias' },
  { texto: 'Contraseña', ruta: '/configuracion/contrasena' },
  { texto: 'Aviso legal', ruta: '/legal' },
];

// Un hijo no escribe aventuras ni cambia su contraseña (lo hace el padre).
const OPCIONES_HIJO: OpcionMas[] = [
  { texto: 'Cliora', ruta: '/cliora' },
  { texto: 'Mi cuenta', ruta: '/configuracion/cuenta' },
  { texto: 'Preferencias', ruta: '/configuracion/preferencias' },
  { texto: 'Aviso legal', ruta: '/legal' },
];

const OPCION_PERFILES: OpcionMas = { texto: 'Cambiar de perfil', ruta: '/perfiles' };

// Bajo el título "Autores": herramientas del autor que no caben en su panel.
const RUTA_INCIDENCIAS = '/autor/incidencias';
const OPCIONES_AUTOR: OpcionMas[] = [{ texto: 'Incidencias', ruta: RUTA_INCIDENCIAS }];
const RUTAS_AUTOR_EN_MAS = OPCIONES_AUTOR.map((o) => o.ruta);

// Van bajo el título "Administración" del desplegable, por eso sin el prefijo "Admin:".
const OPCIONES_ADMIN: OpcionMas[] = [
  { texto: 'Aventuras', ruta: '/admin/aventuras' },
  { texto: 'Usuarios', ruta: '/admin/usuarios' },
  { texto: 'Tipos de universo', ruta: '/admin/tipos-universo' },
  { texto: 'Editar aventuras', ruta: '/admin/editar-aventuras' },
  { texto: 'Precios', ruta: '/admin/precios' },
  { texto: 'Parámetros', ruta: '/admin/parametros' },
  { texto: 'Estadísticas', ruta: '/admin/estadisticas' },
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
  private readonly carritoService = inject(CarritoService);
  protected readonly cantidadCarrito = this.carritoService.cantidad;
  // Los hijos no compran: aunque quede algo en el carrito del padre, no lo ven.
  protected readonly esHijo = computed(() => this.authService.currentUser()?.esHijo ?? false);

  // Burbuja "¡Aventura añadida!" sobre el carrito durante unos segundos tras añadir algo.
  protected readonly burbujaCarrito = signal<{ id: number; texto: string } | null>(null);
  private temporizadorBurbuja: ReturnType<typeof setTimeout> | undefined;

  // Si el adulto tiene hijos, el menú ofrece volver al selector de perfiles.
  private readonly perfilesResource = rxResource({
    params: () => {
      const usuario = this.authService.currentUser();
      return usuario && !usuario.esHijo ? { id: usuario.idUsuario } : undefined;
    },
    stream: () => this.authService.perfiles(),
  });

  protected readonly opcionesUsuario = computed(() => {
    const usuario = this.authService.currentUser();
    if (usuario?.esHijo) {
      return [...OPCIONES_HIJO, OPCION_PERFILES];
    }
    const tieneHijos = (this.perfilesResource.value()?.length ?? 0) > 1;
    return tieneHijos ? [...OPCIONES_USUARIO, OPCION_PERFILES] : OPCIONES_USUARIO;
  });
  // Un perfil de hijo sin contraseña propia se queda fijo en el dispositivo: no puede cerrar sesión.
  protected readonly puedeCerrarSesion = computed(() => {
    const usuario = this.authService.currentUser();
    return !usuario?.esHijo || usuario.accesoPropio;
  });
  protected readonly opcionesAutor = computed(() => (this.authService.tieneRol('Autor') ? OPCIONES_AUTOR : []));
  protected readonly RUTA_INCIDENCIAS = RUTA_INCIDENCIAS;

  // Alertas abiertas en las aventuras del autor (el back solo devuelve las suyas). Se refresca al navegar,
  // así que tras cerrar alertas el contador baja en cuanto se cambia de página.
  private readonly alertaService = inject(AlertaService);
  private readonly incidenciasResource = rxResource({
    params: () => (this.authService.tieneRol('Autor') ? { tick: this.navegacion() } : undefined),
    stream: () => this.alertaService.getAventurasConAlertas(),
  });
  protected readonly totalIncidencias = computed(() =>
    (this.incidenciasResource.value() ?? []).reduce((total, a) => total + a.numeroAlertas, 0),
  );
  protected readonly opcionesAdmin = computed(() => (this.authService.tieneRol('Administrador') ? OPCIONES_ADMIN : []));

  protected readonly menuAbierto = signal(false);
  protected readonly masActivo = computed(() => {
    this.navegacion();
    const url = this.router.url;
    return ['/cliora', '/escribir', '/configuracion', '/admin', '/perfiles', '/legal', ...RUTAS_AUTOR_EN_MAS].some((ruta) =>
      url.startsWith(ruta),
    );
  });
  // «Autor» se ilumina en todo /autor salvo en lo que cuelga de «Más» (Incidencias).
  protected readonly autorActivo = computed(() => {
    this.navegacion();
    const url = this.router.url;
    return url.startsWith('/autor') && !RUTAS_AUTOR_EN_MAS.some((ruta) => url.startsWith(ruta));
  });

  constructor() {
    // Cualquier navegación (elegir una opción, el botón atrás...) cierra el desplegable.
    effect(() => {
      this.navegacion();
      this.menuAbierto.set(false);
    });

    effect(() => {
      const aviso = this.carritoService.aviso();
      if (!aviso) {
        return;
      }
      clearTimeout(this.temporizadorBurbuja);
      this.burbujaCarrito.set(aviso);
      this.temporizadorBurbuja = setTimeout(() => this.burbujaCarrito.set(null), DURACION_BURBUJA_MS);
    });
    inject(DestroyRef).onDestroy(() => clearTimeout(this.temporizadorBurbuja));
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
