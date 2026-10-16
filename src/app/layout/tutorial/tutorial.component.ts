import { Component, computed, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { TutorialService } from '../../core/tutorial/tutorial.service';

interface Hueco {
  top: number;
  left: number;
  width: number;
  height: number;
}

type PosicionBurbuja =
  | { tipo: 'centrada'; ancho: number }
  | { tipo: 'debajo'; top: number; left: number; ancho: number }
  | { tipo: 'encima'; bottom: number; left: number; ancho: number };

// Cuánto se espera a que aparezca el elemento (la página puede estar cargando) antes de enseñar la
// burbuja centrada.
const ESPERA_MAXIMA_MS = 5000;
const MARGEN_FOCO = 6;
const MARGEN_PANTALLA = 16;
const SEPARACION = 12;
const ANCHO_BURBUJA = 360;
// Hueco que necesita la burbuja encima o debajo del elemento; si no cabe, va abajo del todo.
const ALTO_BURBUJA = 190;

/**
 * Capa del tutorial: oscurece la pantalla menos el elemento del paso y pone encima o debajo una
 * burbuja con el texto. Bloquea los toques en el resto; en los pasos de «pulsa…» el toque sobre el
 * elemento resaltado se le pasa a él.
 */
@Component({
  selector: 'app-tutorial',
  templateUrl: './tutorial.component.html',
  styleUrl: './tutorial.component.scss',
  host: { '(window:resize)': 'onResize()' },
})
export class TutorialComponent {
  protected readonly tutorial = inject(TutorialService);

  protected readonly hueco = signal<Hueco | null>(null);
  protected readonly buscando = signal(false);
  private readonly viewport = signal({ ancho: window.innerWidth, alto: window.innerHeight });
  private elemento: HTMLElement | null = null;

  protected readonly posicion = computed<PosicionBurbuja>(() => {
    const { ancho: anchoPantalla, alto: altoPantalla } = this.viewport();
    const ancho = Math.min(ANCHO_BURBUJA, anchoPantalla - 2 * MARGEN_PANTALLA);
    const hueco = this.hueco();
    if (!hueco) {
      return { tipo: 'centrada', ancho };
    }

    const centro = hueco.left + hueco.width / 2;
    const left = Math.min(Math.max(centro - ancho / 2, MARGEN_PANTALLA), anchoPantalla - ancho - MARGEN_PANTALLA);
    const abajo = hueco.top + hueco.height;

    if (altoPantalla - abajo >= ALTO_BURBUJA) {
      return { tipo: 'debajo', top: abajo + SEPARACION, left, ancho };
    }
    if (hueco.top >= ALTO_BURBUJA) {
      return { tipo: 'encima', bottom: altoPantalla - hueco.top + SEPARACION, left, ancho };
    }
    // No cabe ni encima ni debajo (elemento más alto que la pantalla): sobre él, en el extremo
    // contrario a la parte que se ha dejado a la vista.
    if (this.tutorial.paso()?.alinear === 'end') {
      return { tipo: 'debajo', top: MARGEN_PANTALLA, left, ancho };
    }
    return { tipo: 'encima', bottom: MARGEN_PANTALLA, left, ancho };
  });

  constructor() {
    // En cada paso se busca su elemento (puede tardar en aparecer) y después se sigue su posición
    // en cada fotograma: el scroll, las animaciones o el teclado del móvil la mueven.
    // Solo depende del paso: lo demás va en untracked (si leyera el hueco, cada fotograma lo
    // volvería a lanzar).
    effect((onCleanup) => {
      const paso = this.tutorial.paso();
      let cancelado = false;
      let fotograma = 0;
      let reintento: ReturnType<typeof setTimeout> | undefined;
      onCleanup(() => {
        cancelado = true;
        clearTimeout(reintento);
        cancelAnimationFrame(fotograma);
      });

      untracked(() => {
        this.elemento = null;
        this.hueco.set(null);
        if (!paso) {
          return;
        }

        const inicio = Date.now();
        this.buscando.set(!!paso.objetivos?.length);

        const seguir = () => {
          if (cancelado || !this.elemento) {
            return;
          }
          this.actualizarHueco(this.elemento.getBoundingClientRect());
          fotograma = requestAnimationFrame(seguir);
        };

        const buscar = () => {
          if (cancelado) {
            return;
          }
          const elemento = (paso.objetivos ?? [])
            .map((selector) => document.querySelector<HTMLElement>(selector))
            .find((e) => e !== null && e.getClientRects().length > 0);

          if (elemento) {
            this.elemento = elemento;
            elemento.scrollIntoView({ block: paso.alinear ?? 'center', behavior: 'smooth' });
            this.buscando.set(false);
            seguir();
          } else if (paso.objetivos?.length && Date.now() - inicio < ESPERA_MAXIMA_MS) {
            reintento = setTimeout(buscar, 100);
          } else {
            this.buscando.set(false);
          }
        };

        buscar();
      });
    });

    inject(DestroyRef).onDestroy(() => this.tutorial.indice.set(null));
  }

  protected onResize(): void {
    this.viewport.set({ ancho: window.innerWidth, alto: window.innerHeight });
  }

  /** Toques fuera de la burbuja: no llegan a la página (ni cierran el menú «Más»). */
  protected onClickFondo(evento: MouseEvent): void {
    evento.stopPropagation();
    const hueco = this.hueco();
    if (!this.tutorial.paso()?.pulsar || !hueco || !this.elemento) {
      return;
    }

    const dentro =
      evento.clientX >= hueco.left &&
      evento.clientX <= hueco.left + hueco.width &&
      evento.clientY >= hueco.top &&
      evento.clientY <= hueco.top + hueco.height;
    if (dentro) {
      this.elemento.click();
      this.tutorial.siguiente(false);
    }
  }

  private actualizarHueco(rect: DOMRect): void {
    const nuevo: Hueco = {
      top: rect.top - MARGEN_FOCO,
      left: rect.left - MARGEN_FOCO,
      width: rect.width + 2 * MARGEN_FOCO,
      height: rect.height + 2 * MARGEN_FOCO,
    };
    const actual = this.hueco();
    const igual =
      actual !== null &&
      Math.abs(actual.top - nuevo.top) < 0.5 &&
      Math.abs(actual.left - nuevo.left) < 0.5 &&
      Math.abs(actual.width - nuevo.width) < 0.5 &&
      Math.abs(actual.height - nuevo.height) < 0.5;
    if (!igual) {
      this.hueco.set(nuevo);
    }
  }
}
