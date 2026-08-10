import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { FinalAutor } from '../../models/autor.model';

@Component({
  selector: 'app-final-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
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
      return actual
        ? this.autorService.actualizarFinal(actual.idFinal, { titulo, texto })
        : this.autorService.crearFinal(this.idAventura(), { titulo, texto });
    },
    {
      onSuccess: (final) => this.guardado.emit(final),
      defaultErrorMessage: 'No se ha podido guardar el final.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { titulo, texto } = this.form.getRawValue();
    this.guardarAction.run(titulo, texto);
  }
}
