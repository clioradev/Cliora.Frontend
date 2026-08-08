import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { UniversoAutor } from '../../models/autor.model';

@Component({
  selector: 'app-universo-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './universo-form-modal.component.html',
  styleUrl: './universo-form-modal.component.scss',
})
export class UniversoFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly universo = input<UniversoAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<UniversoAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const universo = this.universo();
      if (universo) {
        this.form.patchValue({ titulo: universo.titulo, descripcion: universo.descripcion ?? '' });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, descripcion: string | null) => {
      const actual = this.universo();
      return actual
        ? this.autorService.actualizarUniverso(actual.idUniverso, { titulo, descripcion })
        : this.autorService.crearUniverso({ titulo, descripcion });
    },
    {
      onSuccess: (universo) => this.guardado.emit(universo),
      defaultErrorMessage: 'No se ha podido guardar el universo.',
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
