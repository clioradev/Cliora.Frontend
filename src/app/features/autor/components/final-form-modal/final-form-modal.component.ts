import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { of, switchMap } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { FinalAutor } from '../../models/autor.model';

@Component({
  selector: 'app-final-form-modal',
  imports: [AreaTextoComponent, IconoComponent, ModalComponent, ReactiveFormsModule],
  templateUrl: './final-form-modal.component.html',
  styleUrl: './final-form-modal.component.scss',
})
export class FinalFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idAventura = input.required<number>();
  readonly final = input<FinalAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<FinalAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    texto: ['', [Validators.required]],
  });

  // La imagen se sube o se quita al guardar, para que también se pueda elegir al crear el final
  // (hasta entonces no hay IdFinal al que subirla) y para que «Cancelar» la descarte.
  protected readonly archivoImagen = signal<File | null>(null);
  private readonly quitarImagen = signal(false);
  protected readonly rutaImagen = computed(
    () => this.archivoImagen()?.name ?? (this.quitarImagen() ? null : (this.final()?.imagenUrl ?? null)),
  );

  constructor() {
    effect(() => {
      const final = this.final();
      if (final) {
        this.form.patchValue({ titulo: final.titulo, texto: final.texto });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, texto: string) => {
      const actual = this.final();
      const guardar$ = actual
        ? this.autorService.actualizarFinal(actual.idFinal, { titulo, texto })
        : this.autorService.crearFinal(this.idAventura(), { titulo, texto });
      return guardar$.pipe(
        switchMap((final) => {
          const archivo = this.archivoImagen();
          if (archivo) {
            return this.autorService.subirImagenFinal(final.idFinal, archivo);
          }
          if (this.quitarImagen() && final.imagenUrl) {
            return this.autorService.eliminarImagenFinal(final.idFinal);
          }
          return of(final);
        }),
      );
    },
    {
      onSuccess: (final) => this.guardado.emit(final),
      defaultErrorMessage: 'No se ha podido guardar el final.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected seleccionarImagen(files: FileList | null): void {
    const archivo = files?.item(0);
    if (archivo) {
      this.archivoImagen.set(archivo);
      this.quitarImagen.set(false);
    }
  }

  protected eliminarImagen(): void {
    if (this.archivoImagen()) {
      this.archivoImagen.set(null);
    } else {
      this.quitarImagen.set(true);
    }
  }

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { titulo, texto } = this.form.getRawValue();
    this.guardarAction.run(titulo, texto);
  }
}
