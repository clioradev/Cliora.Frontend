import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { Component, computed, effect, inject, input, output } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AutorService } from '../../data-access/autor.service';
import { CaracteristicaAnteriorAutor, CaracteristicaAutor } from '../../models/autor.model';

// Valor del desplegable "Valor inicial": un número fijo o el id de una característica de una
// aventura anterior de la campaña, de la que se hereda el valor con el que el personaje la terminó.
const ORIGEN_NUMERO = 'numero';

interface GrupoAnteriores {
  tituloAventura: string;
  ordenAventura: number;
  caracteristicas: CaracteristicaAnteriorAutor[];
}

@Component({
  selector: 'app-caracteristica-form-modal',
  imports: [AreaTextoComponent, ModalComponent, ReactiveFormsModule],
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

  protected readonly origenNumero = ORIGEN_NUMERO;

  private readonly tiposResource = rxResource({
    stream: () => this.autorService.getTiposCaracteristica(),
  });
  protected readonly tipos = this.tiposResource.value;

  private readonly anterioresResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.autorService.getCaracteristicasAnteriores(params),
  });

  // Agrupadas por aventura anterior, en el orden de la campaña (el back ya las devuelve así).
  protected readonly gruposAnteriores = computed<GrupoAnteriores[]>(() => {
    const grupos = new Map<number, GrupoAnteriores>();
    for (const c of this.anterioresResource.value() ?? []) {
      const grupo = grupos.get(c.idAventura) ?? {
        tituloAventura: c.tituloAventura,
        ordenAventura: c.ordenAventura,
        caracteristicas: [],
      };
      grupo.caracteristicas.push(c);
      grupos.set(c.idAventura, grupo);
    }
    return [...grupos.values()];
  });

  protected readonly form = this.fb.nonNullable.group({
    idCatTipoCaracteristica: [0, [Validators.required, Validators.min(1)]],
    nombre: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    origenValor: [ORIGEN_NUMERO],
    valorInicial: [0, [Validators.required]],
    visible: [true],
  });

  private readonly origenValor = toSignal(this.form.controls.origenValor.valueChanges, {
    initialValue: ORIGEN_NUMERO,
  });
  protected readonly heredaValor = computed(() => this.origenValor() !== ORIGEN_NUMERO);

  // La característica guardada apunta a una versión antigua de la aventura anterior (que se ha
  // republicado y ya no sale en la lista): se ofrece igualmente para no perder el enlace al editar.
  protected readonly anteriorFueraDeLista = computed(() => {
    const actual = this.caracteristica();
    if (!actual?.idCaracteristicaAnterior || this.anterioresResource.isLoading()) {
      return null;
    }
    return this.buscarOpcion(actual) ? null : actual.idCaracteristicaAnterior;
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

    // El origen se fija cuando ya han llegado las opciones, para que el select pueda mostrarlo.
    effect(() => {
      const caracteristica = this.caracteristica();
      if (!caracteristica?.idCaracteristicaAnterior || this.anterioresResource.isLoading()) {
        return;
      }
      const id = this.buscarOpcion(caracteristica)?.idCaracteristica ?? caracteristica.idCaracteristicaAnterior;
      this.form.controls.origenValor.setValue(String(id));
    });
  }

  private buscarOpcion(caracteristica: CaracteristicaAutor): CaracteristicaAnteriorAutor | undefined {
    return (this.anterioresResource.value() ?? []).find(
      (c) =>
        c.idCaracteristica === caracteristica.idCaracteristicaAnterior ||
        (c.idAventura === caracteristica.idAventuraAnterior && c.codigo === caracteristica.codigoCaracteristicaAnterior),
    );
  }

  private readonly guardarAction = asyncAction(
    () => {
      const { idCatTipoCaracteristica, nombre, descripcion, origenValor, valorInicial, visible } = this.form.getRawValue();
      const dto = {
        idCatTipoCaracteristica,
        nombre,
        descripcion: descripcion.trim() || null,
        // Si hereda, el número solo cuenta si el jugador no tuviera valor de la aventura anterior.
        valorInicial,
        visible,
        idCaracteristicaAnterior: origenValor === ORIGEN_NUMERO ? null : Number(origenValor),
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
