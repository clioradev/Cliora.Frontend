import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { IconoComponent } from '../icono/icono.component';
import { ModalComponent } from '../modal/modal.component';

// Texto largo recortado a unas pocas líneas (respetando los saltos de línea). Si no cabe entero,
// muestra a la derecha un botón con una lupa que abre el texto completo en una modal.
@Component({
  selector: 'app-texto-recortado',
  imports: [IconoComponent, ModalComponent],
  templateUrl: './texto-recortado.component.html',
  styleUrl: './texto-recortado.component.scss',
})
export class TextoRecortadoComponent {
  readonly texto = input.required<string>();
  readonly titulo = input<string>('');

  private readonly parrafo = viewChild.required<ElementRef<HTMLElement>>('parrafo');

  protected readonly desborda = signal(false);
  protected readonly abierto = signal(false);

  constructor() {
    const destroyRef = inject(DestroyRef);

    // El recorte depende del ancho disponible, así que se recalcula cada vez que cambia el tamaño.
    afterNextRender(() => {
      const elemento = this.parrafo().nativeElement;
      const comprobar = () => this.desborda.set(elemento.scrollHeight > elemento.clientHeight + 1);
      const observer = new ResizeObserver(comprobar);
      observer.observe(elemento);
      comprobar();
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
