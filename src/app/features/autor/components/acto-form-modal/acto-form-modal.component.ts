import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { ActoAutor } from '../../models/autor.model';

@Component({
  selector: 'app-acto-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './acto-form-modal.component.html',
  styleUrl: './acto-form-modal.component.scss',
})
export class ActoFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idAventura = input.required<number>();
  readonly acto = input<ActoAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<ActoAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const acto = this.acto();
      if (acto) {
        this.form.patchValue({ titulo: acto.titulo, descripcion: acto.descripcion ?? '' });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, descripcion: string | null) => {
      const actual = this.acto();
      return actual
        ? this.autorService.actualizarActo(actual.idActo, { titulo, descripcion })
        : this.autorService.crearActo(this.idAventura(), { titulo, descripcion });
    },
    {
      onSuccess: (acto) => this.guardado.emit(acto),
      defaultErrorMessage: 'No se ha podido guardar el acto.',
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
