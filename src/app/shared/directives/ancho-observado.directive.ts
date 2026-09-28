import { DestroyRef, Directive, ElementRef, afterNextRender, inject, output } from '@angular/core';

// Emite el ancho (en px) del elemento cada vez que cambia, para poder decidir cuántas cosas caben.
@Directive({
  selector: '[appAnchoObservado]',
})
export class AnchoObservadoDirective {
  readonly appAnchoObservado = output<number>();

  constructor() {
    const elemento = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const observer = new ResizeObserver(() => this.appAnchoObservado.emit(elemento.clientWidth));
      observer.observe(elemento);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }
}
