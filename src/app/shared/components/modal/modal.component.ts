import { Component, DestroyRef, ElementRef, HostListener, inject, input, output } from '@angular/core';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  readonly cerrar = output<void>();
  // 'amplio' para textos largos de lectura: más ancho en pantalla grande.
  readonly ancho = input<'normal' | 'amplio'>('normal');

  constructor() {
    // Se pinta directamente en el body para que ningún contexto de apilamiento (z-index) ni
    // estilo heredado del sitio donde se abre la deje por detrás del resto de la página.
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    document.body.appendChild(host);
    inject(DestroyRef).onDestroy(() => host.remove());
  }

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    this.cerrar.emit();
  }

  protected onBackdropClick(): void {
    this.cerrar.emit();
  }
}
