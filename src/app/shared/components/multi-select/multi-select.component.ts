import { Component, computed, ElementRef, inject, input, output, signal } from '@angular/core';

/**
 * Desplegable de selección múltiple con checkboxes. No guarda estado propio de selección: recibe
 * el conjunto seleccionado y emite cada cambio, igual que un control "controlado", para que el
 * filtrado se aplique al momento de marcar/desmarcar.
 */
@Component({
  selector: 'app-multi-select',
  templateUrl: './multi-select.component.html',
  styleUrl: './multi-select.component.scss',
  host: {
    '(document:click)': 'onDocumentClick($event)',
    '(document:keydown.escape)': 'abierto.set(false)',
  },
})
export class MultiSelectComponent {
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly opciones = input.required<string[]>();
  readonly seleccionadas = input.required<ReadonlySet<string>>();
  readonly placeholder = input('Todos');
  readonly ariaLabel = input<string | null>(null);

  readonly alternado = output<string>();
  readonly limpiado = output<void>();

  protected readonly abierto = signal(false);

  protected readonly resumen = computed(() => {
    const marcadas = this.opciones().filter((o) => this.seleccionadas().has(o));
    if (marcadas.length === 0) {
      return this.placeholder();
    }
    return marcadas.length <= 2 ? marcadas.join(', ') : `${marcadas.length} seleccionados`;
  });

  protected alternarPanel(): void {
    this.abierto.update((v) => !v);
  }

  protected onDocumentClick(event: MouseEvent): void {
    if (this.abierto() && !this.elementRef.nativeElement.contains(event.target as Node)) {
      this.abierto.set(false);
    }
  }
}
