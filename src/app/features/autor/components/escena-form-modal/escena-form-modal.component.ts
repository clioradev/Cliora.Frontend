import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { EscenaAutor } from '../../models/autor.model';

@Component({
  selector: 'app-escena-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './escena-form-modal.component.html',
  styleUrl: './escena-form-modal.component.scss',
})
export class EscenaFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idActo = input.required<number>();
  readonly escena = input<EscenaAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<EscenaAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const escena = this.escena();
      if (escena) {
        this.form.patchValue({ titulo: escena.titulo, descripcion: escena.descripcion ?? '' });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, descripcion: string | null) => {
      const actual = this.escena();
      return actual
        ? this.autorService.actualizarEscena(actual.idEscena, { titulo, descripcion })
        : this.autorService.crearEscena(this.idActo(), { titulo, descripcion });
    },
    {
      onSuccess: (escena) => this.guardado.emit(escena),
      defaultErrorMessage: 'No se ha podido guardar la escena.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { titulo, descripcion } = this.form.getRawValue();
    this.guardarAction.run(titulo, descripcion.trim() || null);
  }
}
