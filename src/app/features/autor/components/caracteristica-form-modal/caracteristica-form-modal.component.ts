import { Component, effect, inject, input, output } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { CaracteristicaAutor } from '../../models/autor.model';

@Component({
  selector: 'app-caracteristica-form-modal',
  imports: [ModalComponent, ReactiveFormsModule],
  templateUrl: './caracteristica-form-modal.component.html',
  styleUrl: './caracteristica-form-modal.component.scss',
})
export class CaracteristicaFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly idAventura = input.required<number>();
  readonly caracteristica = input<CaracteristicaAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<CaracteristicaAutor>();

  private readonly tiposResource = rxResource({
    stream: () => this.autorService.getTiposCaracteristica(),
  });
  protected readonly tipos = this.tiposResource.value;

  protected readonly form = this.fb.nonNullable.group({
    idCatTipoCaracteristica: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    valorInicial: [0, [Validators.required]],
    visible: [true],
  });

  constructor() {
    effect(() => {
      const caracteristica = this.caracteristica();
      if (caracteristica) {
        this.form.patchValue({
          idCatTipoCaracteristica: caracteristica.idCatTipoCaracteristica,
          nombre: caracteristica.nombre,
          descripcion: caracteristica.descripcion ?? '',
          valorInicial: caracteristica.valorInicial,
          visible: caracteristica.visible,
        });
      } else {
        const tipos = this.tiposResource.value();
        if (tipos && tipos.length > 0) {
          this.form.patchValue({ idCatTipoCaracteristica: tipos[0].idCatTipoCaracteristica });
        }
      }
    });
  }

  private readonly guardarAction = asyncAction(
    () => {
      const { idCatTipoCaracteristica, nombre, descripcion, valorInicial, visible } = this.form.getRawValue();
      const dto = {
        idCatTipoCaracteristica,
        nombre,
        descripcion: descripcion.trim() || null,
        valorInicial,
        visible,
      };

      const actual = this.caracteristica();
      return actual
        ? this.autorService.actualizarCaracteristica(actual.idCaracteristica, dto)
        : this.autorService.crearCaracteristica(this.idAventura(), dto);
    },
    {
      onSuccess: (caracteristica) => this.guardado.emit(caracteristica),
      defaultErrorMessage: 'No se ha podido guardar la característica.',
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
