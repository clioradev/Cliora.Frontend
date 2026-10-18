import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { asyncAction } from '../../../../core/utils/async-action';
import { AutorService } from '../../data-access/autor.service';

/**
 * Imagen de un universo o una campaña. El listado infantil se navega solo con imágenes: sin ella,
 * el universo usa la carátula de su primera aventura y la campaña se queda con el título.
 */
@Component({
  selector: 'app-imagen-listado',
  templateUrl: './imagen-listado.component.html',
  styleUrl: './imagen-listado.component.scss',
})
export class ImagenListadoComponent {
  private readonly autorService = inject(AutorService);

  readonly nivel = input.required<'Universo' | 'Campana'>();
  readonly id = input.required<number>();
  readonly imagenUrl = input<string | null>(null);
  readonly cambiada = output<string | null>();

  protected readonly url = signal<string | null>(null);

  constructor() {
    effect(() => this.url.set(this.imagenUrl()));
  }

  private readonly subirAction = asyncAction((archivo: File) => this.autorService.subirImagenListado(this.nivel(), this.id(), archivo), {
    onSuccess: (r) => this.actualizar(r.imagenUrl),
    defaultErrorMessage: 'No se ha podido subir la imagen.',
  });
  private readonly quitarAction = asyncAction(() => this.autorService.eliminarImagenListado(this.nivel(), this.id()), {
    onSuccess: (r) => this.actualizar(r.imagenUrl),
    defaultErrorMessage: 'No se ha podido quitar la imagen.',
  });
  protected readonly ocupado = computed(() => this.subirAction.loading() || this.quitarAction.loading());
  protected readonly error = computed(() => this.subirAction.error() ?? this.quitarAction.error());

  protected seleccionar(files: FileList | null): void {
    const archivo = files?.[0];
    if (archivo) {
      this.subirAction.run(archivo);
    }
  }

  protected quitar(): void {
    this.quitarAction.run();
  }

  private actualizar(url: string | null): void {
    this.url.set(url);
    this.cambiada.emit(url);
  }
}
