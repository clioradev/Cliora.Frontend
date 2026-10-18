import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ImagenListadoComponent } from '../imagen-listado/imagen-listado.component';
import { AutorService } from '../../data-access/autor.service';
import { CatTipoUniversoAutor, PUBLICO_ADULTO, PUBLICO_OPCIONES, UniversoAutor } from '../../models/autor.model';
import { TIPO_TIRADA_ACIERTOS_4D6, TIPO_TIRADA_OPCIONES } from '../../../home/models/universo.model';

@Component({
  selector: 'app-universo-form-modal',
  imports: [AreaTextoComponent, ModalComponent, ReactiveFormsModule, ImagenListadoComponent],
  templateUrl: './universo-form-modal.component.html',
  styleUrl: './universo-form-modal.component.scss',
})
export class UniversoFormModalComponent {
  private readonly fb = inject(FormBuilder);
  private readonly autorService = inject(AutorService);

  readonly universo = input<UniversoAutor | null>(null);
  readonly cerrado = output<void>();
  readonly guardado = output<UniversoAutor>();
  // Separado de `guardado`: marcar/desmarcar un tipo no debe cerrar el modal (el usuario puede
  // querer tocar varios tipos seguidos), a diferencia de guardar el formulario de título/descripción.
  readonly tipoActualizado = output<UniversoAutor>();

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    tipoTirada: [TIPO_TIRADA_ACIERTOS_4D6],
    esRpg: [true],
    idCatTipoUsuario: [PUBLICO_ADULTO],
  });

  protected readonly tipoTiradaOpciones = TIPO_TIRADA_OPCIONES;
  protected readonly publicoOpciones = PUBLICO_OPCIONES;
  private readonly tipoTiradaElegido = signal(TIPO_TIRADA_ACIERTOS_4D6);
  protected readonly ayudaTipoTirada = computed(
    () => TIPO_TIRADA_OPCIONES.find((o) => o.valor === this.tipoTiradaElegido())?.ayuda ?? '',
  );

  private readonly _universoActual = signal<UniversoAutor | null>(null);
  protected readonly universoActual = computed(() => this._universoActual() ?? this.universo());

  private readonly tiposCatalogoResource = rxResource({
    stream: () => this.autorService.getCatalogoTiposUniverso(),
    defaultValue: [] as CatTipoUniversoAutor[],
  });
  protected readonly tiposCatalogo = this.tiposCatalogoResource.value;

  constructor() {
    this.form.controls.tipoTirada.valueChanges.subscribe((valor) => this.tipoTiradaElegido.set(Number(valor)));

    effect(() => {
      const universo = this.universo();
      this._universoActual.set(universo);
      if (universo) {
        this.form.patchValue({
          titulo: universo.titulo,
          descripcion: universo.descripcion ?? '',
          tipoTirada: universo.tipoTirada ?? TIPO_TIRADA_ACIERTOS_4D6,
          esRpg: universo.esRpg ?? true,
          idCatTipoUsuario: universo.idCatTipoUsuario ?? PUBLICO_ADULTO,
        });
      }
    });
  }

  protected tieneTipo(tipo: CatTipoUniversoAutor): boolean {
    return this.universoActual()?.tipos.some((t) => t.idCatTipoUniverso === tipo.id) ?? false;
  }

  private readonly toggleTipoAction = asyncAction(
    (tipo: CatTipoUniversoAutor, activar: boolean) => {
      const idUniverso = this.universoActual()!.idUniverso;
      return activar
        ? this.autorService.anadirTipoUniverso(idUniverso, tipo.id)
        : this.autorService.quitarTipoUniverso(idUniverso, tipo.id);
    },
    {
      onSuccess: (universoActualizado) => {
        this._universoActual.set(universoActualizado);
        this.tipoActualizado.emit(universoActualizado);
      },
      defaultErrorMessage: 'No se ha podido actualizar el tipo de universo.',
    },
  );
  protected readonly actualizandoTipo = this.toggleTipoAction.loading;
  protected readonly errorTipo = this.toggleTipoAction.error;

  protected toggleTipo(tipo: CatTipoUniversoAutor, evento: Event): void {
    const activar = (evento.target as HTMLInputElement).checked;
    this.toggleTipoAction.run(tipo, activar);
  }

  private readonly guardarAction = asyncAction(
    (titulo: string, descripcion: string | null, tipoTirada: number, esRpg: boolean, idCatTipoUsuario: number) => {
      const actual = this.universo();
      return actual
        ? this.autorService.actualizarUniverso(actual.idUniverso, { titulo, descripcion, tipoTirada, esRpg, idCatTipoUsuario })
        : this.autorService.crearUniverso({ titulo, descripcion, tipoTirada, esRpg, idCatTipoUsuario });
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

    const { titulo, descripcion, tipoTirada, esRpg, idCatTipoUsuario } = this.form.getRawValue();
    this.guardarAction.run(titulo, descripcion.trim() || null, Number(tipoTirada), esRpg, Number(idCatTipoUsuario));
  }
}
