import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { Component, effect, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ImagenListadoComponent } from '../imagen-listado/imagen-listado.component';
import { AutorService } from '../../data-access/autor.service';
import { CampanaAutor, GuardarCampanaRequest } from '../../models/autor.model';

@Component({
  selector: 'app-campana-form-modal',
  imports: [AreaTextoComponent, ModalComponent, ReactiveFormsModule, ImagenListadoComponent],
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
    aventurasIndependientes: [false],
  });

  constructor() {
    effect(() => {
      const campana = this.campana();
      if (campana) {
        this.form.patchValue({
          titulo: campana.titulo,
          descripcion: campana.descripcion ?? '',
          aventurasIndependientes: campana.aventurasIndependientes,
        });
      }
    });
  }

  private readonly guardarAction = asyncAction(
    (dto: GuardarCampanaRequest) => {
      const actual = this.campana();
      return actual
        ? this.autorService.actualizarCampana(actual.idCampana, dto)
        : this.autorService.crearCampana(this.idUniverso(), dto);
    },
    {
      onSuccess: (campana) => this.guardado.emit(campana),
      // Al marcar «aventuras independientes» el servidor puede devolver la lista de referencias
      // entre aventuras que lo impiden: una por línea.
      resolveErrorMessage: (err) => {
        const body = (err as { error?: unknown } | null)?.error;
        return Array.isArray(body) && body.every((m) => typeof m === 'string')
          ? body.join('\n')
          : 'No se ha podido guardar la campaña.';
      },
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { titulo, descripcion, aventurasIndependientes } = this.form.getRawValue();
    this.guardarAction.run({ titulo, descripcion: descripcion.trim() || null, aventurasIndependientes });
  }
}
