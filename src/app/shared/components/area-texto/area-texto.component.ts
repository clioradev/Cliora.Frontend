import { Component, ElementRef, effect, forwardRef, input, signal, viewChild } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconoComponent } from '../icono/icono.component';
import { ModalComponent } from '../modal/modal.component';

// Textarea con un botón para editarlo ampliado en un modal grande. Funciona como control de
// formulario (formControlName, formControl o ngModel). "Aplicar" en el modal solo sustituye el
// texto del textarea, no guarda nada: el guardado sigue siendo cosa del formulario que lo usa.
@Component({
  selector: 'app-area-texto',
  imports: [IconoComponent, ModalComponent],
  templateUrl: './area-texto.component.html',
  styleUrl: './area-texto.component.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => AreaTextoComponent), multi: true }],
})
export class AreaTextoComponent implements ControlValueAccessor {
  readonly rows = input(4);
  readonly placeholder = input('');
  readonly tituloEditor = input('Editar texto');

  protected readonly valor = signal('');
  protected readonly deshabilitado = signal(false);
  protected readonly editorAbierto = signal(false);
  protected readonly borrador = signal('');

  private readonly editor = viewChild<ElementRef<HTMLTextAreaElement>>('editor');

  private onChange: (valor: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    // Al abrir el editor, el foco va al textarea grande con el cursor al final del texto.
    effect(() => {
      const editor = this.editor()?.nativeElement;
      if (editor) {
        editor.focus();
        editor.setSelectionRange(editor.value.length, editor.value.length);
      }
    });
  }

  writeValue(valor: string | null): void {
    this.valor.set(valor ?? '');
  }

  registerOnChange(fn: (valor: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(deshabilitado: boolean): void {
    this.deshabilitado.set(deshabilitado);
  }

  protected onInput(evento: Event): void {
    this.cambiarValor((evento.target as HTMLTextAreaElement).value);
  }

  protected onBlur(): void {
    this.onTouched();
  }

  protected abrirEditor(): void {
    this.borrador.set(this.valor());
    this.editorAbierto.set(true);
  }

  protected onBorradorInput(evento: Event): void {
    this.borrador.set((evento.target as HTMLTextAreaElement).value);
  }

  protected aplicar(): void {
    if (this.borrador() !== this.valor()) {
      this.cambiarValor(this.borrador());
    }
    this.onTouched();
    this.editorAbierto.set(false);
  }

  protected cancelar(): void {
    this.editorAbierto.set(false);
  }

  private cambiarValor(valor: string): void {
    this.valor.set(valor);
    this.onChange(valor);
  }
}
