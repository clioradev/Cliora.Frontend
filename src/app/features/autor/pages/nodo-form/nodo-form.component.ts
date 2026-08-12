import { NgTemplateOutlet } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AbstractControl, FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { CaracteristicaFormModalComponent } from '../../components/caracteristica-form-modal/caracteristica-form-modal.component';
import { CrearNodoDestinoModalComponent } from '../../components/crear-nodo-destino-modal/crear-nodo-destino-modal.component';
import { EventoFormModalComponent } from '../../components/evento-form-modal/evento-form-modal.component';
import { AutorService } from '../../data-access/autor.service';
import {
  CaracteristicaAutor,
  CondicionAutor,
  ContenidoNodoAutor,
  EfectoAutor,
  EnumOperacionCondicion,
  EnumOperacionEfecto,
  EventoAutor,
  FinalAutor,
  GrupoCondicionAutor,
  NodoArbol,
  NodoAutorResumen,
  OpcionArbol,
  ResultadoAutor,
} from '../../models/autor.model';

type Rama = 'resultado' | 'resultadoFracaso';

@Component({
  selector: 'app-nodo-form',
  imports: [
    ReactiveFormsModule,
    NgTemplateOutlet,
    IconoComponent,
    ConfirmarEliminarModalComponent,
    CrearNodoDestinoModalComponent,
    CaracteristicaFormModalComponent,
    EventoFormModalComponent,
  ],
  templateUrl: './nodo-form.component.html',
  styleUrl: './nodo-form.component.scss',
})
export class NodoFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autorService = inject(AutorService);
  private readonly fb = inject(FormBuilder);

  protected readonly EnumOperacionCondicion = EnumOperacionCondicion;
  protected readonly EnumOperacionEfecto = EnumOperacionEfecto;

  protected readonly idAventura = Number(this.route.snapshot.paramMap.get('idAventura'));
  protected readonly idNodo = Number(this.route.snapshot.paramMap.get('idNodo'));

  protected readonly operacionCondicionOpciones = [
    { valor: EnumOperacionCondicion.Igual, etiqueta: 'Igual a' },
    { valor: EnumOperacionCondicion.Distinto, etiqueta: 'Distinto de' },
    { valor: EnumOperacionCondicion.Mayor, etiqueta: 'Mayor que' },
    { valor: EnumOperacionCondicion.MayorOIgual, etiqueta: 'Mayor o igual que' },
    { valor: EnumOperacionCondicion.Menor, etiqueta: 'Menor que' },
    { valor: EnumOperacionCondicion.MenorOIgual, etiqueta: 'Menor o igual que' },
  ];

  protected readonly operacionEfectoOpciones = [
    { valor: EnumOperacionEfecto.Sumar, etiqueta: 'Sumar' },
    { valor: EnumOperacionEfecto.Establecer, etiqueta: 'Establecer' },
  ];

  private readonly nodoResource = rxResource({
    params: () => this.idNodo,
    stream: ({ params }) => this.autorService.getNodo(params),
  });
  protected readonly cargando = this.nodoResource.isLoading;
  protected readonly nodo = this.nodoResource.value;

  private readonly caracteristicasResource = rxResource({
    params: () => this.idAventura,
    stream: ({ params }) => this.autorService.getCaracteristicas(params),
  });
  protected readonly caracteristicas = this.caracteristicasResource.value;

  private readonly eventosResource = rxResource({
    params: () => this.idAventura,
    stream: ({ params }) => this.autorService.getEventos(params),
  });
  protected readonly eventos = this.eventosResource.value;

  protected readonly errorValidacion = signal<string | null>(null);

  protected readonly CREAR_NODO_DESTINO = '__crear__';
  protected readonly CREAR_CARACTERISTICA = '__crear_caracteristica__';
  protected readonly CREAR_EVENTO = '__crear_evento__';
  protected readonly nodosDisponibles = signal<NodoAutorResumen[]>([]);
  protected readonly finalesDisponibles = signal<FinalAutor[]>([]);

  protected readonly opcionIndexCreandoDestino = signal<{ opcionIndex: number; rama: Rama } | null>(null);

  protected readonly efectoCreandoVariable = signal<{
    opcionIndex: number;
    rama: Rama;
    efectoIndex: number;
    tipo: 'caracteristica' | 'evento';
  } | null>(null);

  protected readonly opcionIndexCreandoCaracteristicaTirada = signal<number | null>(null);

  protected readonly eliminarContenidoIndex = signal<number | null>(null);
  protected readonly eliminarOpcionIndex = signal<number | null>(null);

  private crearContenidoGroup(contenido?: ContenidoNodoAutor) {
    return this.fb.group({
      texto: this.fb.nonNullable.control(contenido?.texto ?? '', [Validators.required]),
      gruposCondicion: this.fb.array((contenido?.gruposCondicion ?? []).map((g) => this.crearGrupoCondicionGroup(g))),
    });
  }

  private crearCondicionGroup(condicion?: CondicionAutor) {
    return this.fb.group({
      idCaracteristica: this.fb.nonNullable.control<number | null>(condicion?.idCaracteristica ?? null, [
        Validators.required,
      ]),
      operacion: this.fb.nonNullable.control(condicion?.operacion ?? EnumOperacionCondicion.Igual, [
        Validators.required,
      ]),
      valor: this.fb.nonNullable.control(condicion?.valor ?? 0, [Validators.required]),
    });
  }

  private crearGrupoCondicionGroup(grupo?: GrupoCondicionAutor) {
    return this.fb.group({
      condiciones: this.fb.array((grupo?.condiciones ?? []).map((c) => this.crearCondicionGroup(c))),
    });
  }

  private primeraCaracteristica(): number | null {
    return this.caracteristicasResource.value()?.[0]?.idCaracteristica ?? null;
  }

  private primerEvento(): number | null {
    return this.eventosResource.value()?.[0]?.idEvento ?? null;
  }

  private crearEfectoGroup(efecto?: EfectoAutor) {
    return this.fb.group({
      tipoVariable: this.fb.nonNullable.control<'caracteristica' | 'evento'>(
        efecto?.idEvento != null ? 'evento' : 'caracteristica',
      ),
      idCaracteristica: this.fb.nonNullable.control<number | null>(
        efecto?.idCaracteristica ?? (efecto ? null : this.primeraCaracteristica()),
      ),
      idEvento: this.fb.nonNullable.control<number | null>(
        efecto?.idEvento ?? (efecto ? null : this.primerEvento()),
      ),
      operacionEfecto: this.fb.nonNullable.control(efecto?.operacionEfecto ?? EnumOperacionEfecto.Sumar),
      valor: this.fb.nonNullable.control(efecto?.valor ?? 0),
      marcado: this.fb.nonNullable.control(efecto?.operacionEfecto !== EnumOperacionEfecto.EliminarEvento),
    });
  }

  private crearResultadoGroup(resultado?: ResultadoAutor | null) {
    return this.fb.group({
      tipoDestino: this.fb.nonNullable.control<'nodo' | 'final'>(
        resultado?.idFinal != null ? 'final' : 'nodo',
      ),
      idNodoDestino: this.fb.nonNullable.control<number | null>(resultado?.idNodoDestino ?? null),
      idFinal: this.fb.nonNullable.control<number | null>(resultado?.idFinal ?? null),
      efectos: this.fb.array((resultado?.efectos ?? []).map((e) => this.crearEfectoGroup(e))),
    });
  }

  private crearOpcionGroup(opcion?: OpcionArbol) {
    const tieneTirada = opcion?.dificultad != null;
    return this.fb.group({
      texto: this.fb.nonNullable.control(opcion?.texto ?? '', [Validators.required, Validators.maxLength(500)]),
      gruposCondicion: this.fb.array((opcion?.gruposCondicion ?? []).map((g) => this.crearGrupoCondicionGroup(g))),
      tieneTirada: this.fb.nonNullable.control(tieneTirada),
      idCaracteristicaTirada: this.fb.nonNullable.control<number | null>(opcion?.idCaracteristicaTirada ?? null),
      dificultad: this.fb.nonNullable.control<number | null>(opcion?.dificultad ?? null),
      resultado: this.crearResultadoGroup(opcion?.resultado),
      resultadoFracaso: this.crearResultadoGroup(opcion?.resultadoFracaso),
    });
  }

  protected readonly form = this.fb.group({
    titulo: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(200)]),
    contenidos: this.fb.array<ReturnType<typeof this.crearContenidoGroup>>([]),
    opciones: this.fb.array<ReturnType<typeof this.crearOpcionGroup>>([]),
  });

  protected get contenidos(): FormArray {
    return this.form.controls.contenidos;
  }

  protected get opciones(): FormArray {
    return this.form.controls.opciones;
  }

  constructor() {
    effect(() => {
      const nodo = this.nodoResource.value();
      if (nodo) {
        this.precargarFormulario(nodo);
      }
    });
  }

  private precargarFormulario(nodo: NodoArbol): void {
    this.form.patchValue({ titulo: nodo.titulo });
    this.nodosDisponibles.set(nodo.nodosDisponibles);
    this.finalesDisponibles.set(nodo.finalesDisponibles);

    this.contenidos.clear();
    const contenidos: ContenidoNodoAutor[] =
      nodo.contenidos.length > 0 ? nodo.contenidos : [{ orden: 1, texto: '', gruposCondicion: [] }];
    contenidos.forEach((c) => this.contenidos.push(this.crearContenidoGroup(c)));

    this.opciones.clear();
    nodo.opciones.forEach((o) => this.opciones.push(this.crearOpcionGroup(o)));
  }

  protected agregarContenido(despuesDeIndex?: number): void {
    const nuevo = this.crearContenidoGroup();
    if (despuesDeIndex === undefined) {
      this.contenidos.push(nuevo);
    } else {
      this.contenidos.insert(despuesDeIndex + 1, nuevo);
    }
  }

  protected pedirEliminarContenido(index: number): void {
    this.eliminarContenidoIndex.set(index);
  }

  protected cerrarEliminarContenido(): void {
    this.eliminarContenidoIndex.set(null);
  }

  protected readonly confirmarEliminarContenido = (): Observable<void> => {
    const index = this.eliminarContenidoIndex();
    if (index !== null) {
      this.contenidos.removeAt(index);
    }
    return of(undefined);
  };

  protected agregarOpcion(): void {
    this.opciones.push(this.crearOpcionGroup());
  }

  protected pedirEliminarOpcion(index: number): void {
    this.eliminarOpcionIndex.set(index);
  }

  protected cerrarEliminarOpcion(): void {
    this.eliminarOpcionIndex.set(null);
  }

  protected readonly confirmarEliminarOpcion = (): Observable<void> => {
    const index = this.eliminarOpcionIndex();
    if (index !== null) {
      this.opciones.removeAt(index);
    }
    return of(undefined);
  };

  protected resultadoGroupDe(opcionIndex: number, rama: Rama): FormGroup {
    return this.opciones.at(opcionIndex).get(rama) as FormGroup;
  }

  protected onSeleccionNodoDestino(opcionIndex: number, rama: Rama, valor: string): void {
    if (valor === this.CREAR_NODO_DESTINO) {
      this.resultadoGroupDe(opcionIndex, rama).get('idNodoDestino')!.setValue(null);
      this.opcionIndexCreandoDestino.set({ opcionIndex, rama });
    }
  }

  protected onNodoDestinoCreado(nodo: NodoAutorResumen): void {
    this.nodosDisponibles.update((lista) => [...lista, nodo]);
    const destino = this.opcionIndexCreandoDestino();
    if (destino) {
      this.resultadoGroupDe(destino.opcionIndex, destino.rama).get('idNodoDestino')!.setValue(nodo.idNodo);
    }
    this.opcionIndexCreandoDestino.set(null);
  }

  protected cerrarModalNodoDestino(): void {
    this.opcionIndexCreandoDestino.set(null);
  }

  protected onCambioTipoEfecto(opcionIndex: number, rama: Rama, efectoIndex: number): void {
    const grupo = this.efectosDe(opcionIndex, rama).at(efectoIndex);
    const tipoVariable = grupo.get('tipoVariable')!.value as 'caracteristica' | 'evento';
    grupo.patchValue({
      idCaracteristica: tipoVariable === 'caracteristica' ? this.primeraCaracteristica() : null,
      idEvento: tipoVariable === 'evento' ? this.primerEvento() : null,
      operacionEfecto: EnumOperacionEfecto.Sumar,
      marcado: true,
    });
  }

  protected abrirCrearCaracteristica(opcionIndex: number, rama: Rama, efectoIndex: number): void {
    this.efectoCreandoVariable.set({ opcionIndex, rama, efectoIndex, tipo: 'caracteristica' });
  }

  protected abrirCrearEvento(opcionIndex: number, rama: Rama, efectoIndex: number): void {
    this.efectoCreandoVariable.set({ opcionIndex, rama, efectoIndex, tipo: 'evento' });
  }

  protected onSeleccionCaracteristica(opcionIndex: number, rama: Rama, efectoIndex: number, valor: string): void {
    if (valor === this.CREAR_CARACTERISTICA) {
      this.efectosDe(opcionIndex, rama).at(efectoIndex).get('idCaracteristica')!.setValue(this.primeraCaracteristica());
      this.abrirCrearCaracteristica(opcionIndex, rama, efectoIndex);
    }
  }

  protected onSeleccionEvento(opcionIndex: number, rama: Rama, efectoIndex: number, valor: string): void {
    if (valor === this.CREAR_EVENTO) {
      this.efectosDe(opcionIndex, rama).at(efectoIndex).get('idEvento')!.setValue(this.primerEvento());
      this.abrirCrearEvento(opcionIndex, rama, efectoIndex);
    }
  }

  protected cerrarModalVariable(): void {
    this.efectoCreandoVariable.set(null);
  }

  protected onCaracteristicaCreada(caracteristica: CaracteristicaAutor): void {
    this.caracteristicasResource.value.update((lista) => [...(lista ?? []), caracteristica]);
    const destino = this.efectoCreandoVariable();
    if (destino) {
      this.efectosDe(destino.opcionIndex, destino.rama)
        .at(destino.efectoIndex)
        .get('idCaracteristica')!
        .setValue(caracteristica.idCaracteristica);
    }
    this.efectoCreandoVariable.set(null);
  }

  protected onEventoCreado(evento: EventoAutor): void {
    this.eventosResource.value.update((lista) => [...(lista ?? []), evento]);
    const destino = this.efectoCreandoVariable();
    if (destino) {
      this.efectosDe(destino.opcionIndex, destino.rama).at(destino.efectoIndex).get('idEvento')!.setValue(evento.idEvento);
    }
    this.efectoCreandoVariable.set(null);
  }

  protected onSeleccionCaracteristicaTirada(opcionIndex: number, valor: string): void {
    if (valor === this.CREAR_CARACTERISTICA) {
      this.opciones.at(opcionIndex).get('idCaracteristicaTirada')!.setValue(null);
      this.opcionIndexCreandoCaracteristicaTirada.set(opcionIndex);
    }
  }

  protected onCaracteristicaTiradaCreada(caracteristica: CaracteristicaAutor): void {
    this.caracteristicasResource.value.update((lista) => [...(lista ?? []), caracteristica]);
    const opcionIndex = this.opcionIndexCreandoCaracteristicaTirada();
    if (opcionIndex !== null) {
      this.opciones.at(opcionIndex).get('idCaracteristicaTirada')!.setValue(caracteristica.idCaracteristica);
    }
    this.opcionIndexCreandoCaracteristicaTirada.set(null);
  }

  protected cerrarModalCaracteristicaTirada(): void {
    this.opcionIndexCreandoCaracteristicaTirada.set(null);
  }

  protected gruposCondicionDe(control: AbstractControl): FormArray {
    return control.get('gruposCondicion') as FormArray;
  }

  protected agregarGrupoCondicion(grupos: FormArray): void {
    grupos.push(this.crearGrupoCondicionGroup());
  }

  protected quitarGrupoCondicion(grupos: FormArray, grupoIndex: number): void {
    grupos.removeAt(grupoIndex);
  }

  protected condicionesDe(grupos: FormArray, grupoIndex: number): FormArray {
    return (grupos.at(grupoIndex) as FormGroup).get('condiciones') as FormArray;
  }

  protected agregarCondicion(grupos: FormArray, grupoIndex: number): void {
    this.condicionesDe(grupos, grupoIndex).push(this.crearCondicionGroup());
  }

  protected quitarCondicion(grupos: FormArray, grupoIndex: number, condicionIndex: number): void {
    this.condicionesDe(grupos, grupoIndex).removeAt(condicionIndex);
  }

  protected efectosDe(opcionIndex: number, rama: Rama): FormArray {
    return this.resultadoGroupDe(opcionIndex, rama).get('efectos') as FormArray;
  }

  protected agregarEfecto(opcionIndex: number, rama: Rama): void {
    this.efectosDe(opcionIndex, rama).push(this.crearEfectoGroup());
  }

  protected quitarEfecto(opcionIndex: number, rama: Rama, efectoIndex: number): void {
    this.efectosDe(opcionIndex, rama).removeAt(efectoIndex);
  }

  protected marcarInicial(): void {
    this.autorService.marcarNodoInicial(this.idNodo).subscribe(() => this.nodoResource.reload());
  }

  private readonly guardarAction = asyncAction(
    () => {
      const raw = this.form.getRawValue();

      // Los <select> nativos entregan el valor elegido como string aunque el FormControl
      // esté tipado como number | null; aquí se normaliza antes de enviarlo al backend.
      const toNum = (v: unknown): number | null => (v === null || v === undefined || v === '' ? null : Number(v));

      const mapResultado = (r: (typeof raw.opciones)[number]['resultado']) => ({
        idNodoDestino: r.tipoDestino === 'nodo' ? toNum(r.idNodoDestino) : null,
        idFinal: r.tipoDestino === 'final' ? toNum(r.idFinal) : null,
        efectos: r.efectos.map((e) =>
          e.tipoVariable === 'evento'
            ? {
                idCaracteristica: null,
                idEvento: toNum(e.idEvento),
                operacionEfecto: e.marcado ? EnumOperacionEfecto.AnadirEvento : EnumOperacionEfecto.EliminarEvento,
                valor: null,
              }
            : {
                idCaracteristica: toNum(e.idCaracteristica),
                idEvento: null,
                operacionEfecto: toNum(e.operacionEfecto)!,
                valor: e.valor,
              },
        ),
      });

      const dto = {
        titulo: raw.titulo,
        contenidos: raw.contenidos.map((c, index) => ({
          orden: index + 1,
          texto: c.texto,
          gruposCondicion: c.gruposCondicion.map((g) => ({
            condiciones: g.condiciones.map((cond) => ({
              idCaracteristica: toNum(cond.idCaracteristica)!,
              operacion: toNum(cond.operacion)!,
              valor: cond.valor,
            })),
          })),
        })),
        opciones: raw.opciones.map((o) => ({
          texto: o.texto,
          gruposCondicion: o.gruposCondicion.map((g) => ({
            condiciones: g.condiciones.map((c) => ({
              idCaracteristica: toNum(c.idCaracteristica)!,
              operacion: toNum(c.operacion)!,
              valor: c.valor,
            })),
          })),
          idCaracteristicaTirada: o.tieneTirada ? toNum(o.idCaracteristicaTirada) : null,
          dificultad: o.tieneTirada ? o.dificultad : null,
          resultado: mapResultado(o.resultado),
          resultadoFracaso: o.tieneTirada ? mapResultado(o.resultadoFracaso) : null,
        })),
      };

      return this.autorService.guardarArbolNodo(this.idNodo, dto);
    },
    {
      onSuccess: () => this.nodoResource.reload(),
      defaultErrorMessage: 'No se ha podido guardar el nodo.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly error = this.guardarAction.error;

  protected guardar(): void {
    this.errorValidacion.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.opciones.length === 0) {
      this.errorValidacion.set('El nodo debe tener al menos una opción.');
      return;
    }

    const raw = this.form.getRawValue();

    const faltaTirada = raw.opciones.some((o) => o.tieneTirada && o.dificultad == null);
    if (faltaTirada) {
      this.errorValidacion.set('Cada opción con tirada debe tener una dificultad.');
      return;
    }

    const faltaDestino = (r: { tipoDestino: 'nodo' | 'final'; idNodoDestino: number | null; idFinal: number | null }) =>
      r.tipoDestino === 'nodo' ? r.idNodoDestino == null : r.idFinal == null;
    if (raw.opciones.some((o) => faltaDestino(o.resultado) || (o.tieneTirada && faltaDestino(o.resultadoFracaso)))) {
      this.errorValidacion.set('Cada resultado debe llevar a un nodo o a un final.');
      return;
    }

    const faltaVariable = (
      efectos: { tipoVariable: 'caracteristica' | 'evento'; idCaracteristica: number | null; idEvento: number | null }[],
    ) => efectos.some((e) => (e.tipoVariable === 'evento' ? e.idEvento == null : e.idCaracteristica == null));
    if (
      raw.opciones.some(
        (o) => faltaVariable(o.resultado.efectos) || (o.tieneTirada && faltaVariable(o.resultadoFracaso.efectos)),
      )
    ) {
      this.errorValidacion.set('Cada efecto debe tener una característica o un evento seleccionado.');
      return;
    }

    this.guardarAction.run();
  }

  protected volver(): void {
    void this.router.navigate(['/autor/aventura', this.idAventura], { queryParams: { tab: 'contenido' } });
  }
}
