import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { EscenaResumenAutor, NodoAutorResumen } from '../../models/autor.model';

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
  readonly idEscenaActual = input.required<number>();
  readonly escenasDisponibles = input.required<EscenaResumenAutor[]>();
  readonly cerrado = output<void>();
  readonly guardado = output<NodoAutorResumen>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    idEscena: [0, [Validators.required]],
  });

  constructor() {
    // Por defecto se vincula a la escena del nodo desde el que se está creando, pero se puede
    // elegir otra: el nuevo nodo no tiene por qué quedarse en la misma escena. Se fija mediante
    // effect() (y no en el field initializer de arriba) porque los inputs required aún no están
    // resueltos durante la inicialización de campos.
    effect(() => this.form.patchValue({ idEscena: this.idEscenaActual() }));
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, idEscena: number) => this.autorService.crearNodoDestino(this.idNodoOrigen(), { titulo, idEscena }),
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

    const { titulo, idEscena } = this.form.getRawValue();
    this.guardarAction.run(titulo, Number(idEscena));
  }
}
