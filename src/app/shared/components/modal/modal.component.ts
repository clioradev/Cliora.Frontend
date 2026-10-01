import { Component, DestroyRef, ElementRef, HostListener, afterNextRender, inject, input, output } from '@angular/core';

// Modales abiertos, en orden de apertura: con uno encima de otro (p. ej. el editor ampliado de
// un textarea dentro de un formulario modal), Escape solo debe cerrar el de más arriba.
const modalesAbiertos: ModalComponent[] = [];

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly cerrar = output<void>();
  // 'amplio' para textos largos de lectura: más ancho en pantalla grande.
  // 'completo' ocupa el 80% del ancho y el 90% del alto, con el contenido en columna.
  readonly ancho = input<'normal' | 'amplio' | 'completo'>('normal');
  // false para modales donde un clic accidental fuera haría perder lo escrito.
  readonly cerrarAlPulsarFondo = input(true);

  constructor() {
    // Se pinta directamente en el body para que ningún contexto de apilamiento (z-index) ni
    // estilo heredado del sitio donde se abre la deje por detrás del resto de la página.
    // Se mueve tras el primer render: en el constructor Angular aún no ha insertado el host
    // en su sitio y, al hacerlo, lo devolvería al lugar original.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    afterNextRender(() => document.body.appendChild(host));
    modalesAbiertos.push(this);
    inject(DestroyRef).onDestroy(() => {
      host.remove();
      modalesAbiertos.splice(modalesAbiertos.indexOf(this), 1);
    });
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (modalesAbiertos.at(-1) === this) {
      this.cerrar.emit();
    }
  }

  protected onBackdropClick(): void {
    if (this.cerrarAlPulsarFondo()) {
      this.cerrar.emit();
    }
  }
}
