import { Component, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { NodoAutorResumen } from '../../models/autor.model';

@Component({
  selector: 'app-crear-nodo-destino-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './crear-nodo-destino-modal.component.html',
  styleUrl: './crear-nodo-destino-modal.component.scss',
})
export class CrearNodoDestinoModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idNodoOrigen = input.required<number>();
  readonly cerrado = output<void>();
  readonly guardado = output<NodoAutorResumen>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
  });

  private readonly guardarAction = asyncAction(
    (titulo: string) => this.autorService.crearNodoDestino(this.idNodoOrigen(), { titulo }),
    {
      onSuccess: (nodo) => this.guardado.emit(nodo),
      defaultErrorMessage: 'No se ha podido crear el nodo destino.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { titulo } = this.form.getRawValue();
    this.guardarAction.run(titulo);
  }
}
