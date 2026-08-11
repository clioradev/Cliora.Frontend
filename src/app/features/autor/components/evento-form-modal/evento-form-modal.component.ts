import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { EventoAutor } from '../../models/autor.model';

@Component({
  selector: 'app-evento-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './evento-form-modal.component.html',
  styleUrl: './evento-form-modal.component.scss',
})
export class EventoFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idAventura = input.required<number>();
  readonly evento = input<EventoAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<EventoAutor>();

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
  });

  constructor() {
    effect(() => {
      const evento = this.evento();
      if (evento) {
        this.form.patchValue({
          nombre: evento.nombre,
          descripcion: evento.descripcion ?? '',
        });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    () => {
      const { nombre, descripcion } = this.form.getRawValue();
      const dto = { nombre, descripcion: descripcion.trim() || null };

      const actual = this.evento();
      return actual
        ? this.autorService.actualizarEvento(actual.idEvento, dto)
        : this.autorService.crearEvento(this.idAventura(), dto);
    },
    {
      onSuccess: (evento) => this.guardado.emit(evento),
      defaultErrorMessage: 'No se ha podido guardar el evento.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }
    this.guardarAction.run();
  }
}
