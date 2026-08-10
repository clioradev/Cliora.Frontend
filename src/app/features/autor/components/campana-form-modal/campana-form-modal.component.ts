import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { CampanaAutor } from '../../models/autor.model';

@Component({
  selector: 'app-campana-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './campana-form-modal.component.html',
  styleUrl: './campana-form-modal.component.scss',
})
export class CampanaFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idUniverso = input.required<number>();
  readonly campana = input<CampanaAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<CampanaAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const campana = this.campana();
      if (campana) {
        this.form.patchValue({ titulo: campana.titulo, descripcion: campana.descripcion ?? '' });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, descripcion: string | null) => {
      const actual = this.campana();
      return actual
        ? this.autorService.actualizarCampana(actual.idCampana, { titulo, descripcion })
        : this.autorService.crearCampana(this.idUniverso(), { titulo, descripcion });
    },
    {
      onSuccess: (campana) => this.guardado.emit(campana),
      defaultErrorMessage: 'No se ha podido guardar la campaña.',
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
