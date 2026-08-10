import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { PreferenciasAplicadasService } from '../../data-access/preferencias-aplicadas.service';
import { PreferenciasService } from '../../data-access/preferencias.service';
import {
  ANCHO_LECTURA_OPCIONES,
  ESPACIADO_LINEAS_OPCIONES,
  Preferencias,
  TAMANO_FUENTE_OPCIONES,
  TEMA_OPCIONES,
  TIPOGRAFIA_OPCIONES,
} from '../../models/preferencias.model';

@Component({
  selector: 'app-configuracion',
  imports: [],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.scss',
})
export class ConfiguracionComponent {
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);

  protected readonly temaOpciones = TEMA_OPCIONES;
  protected readonly tipografiaOpciones = TIPOGRAFIA_OPCIONES;
  protected readonly tamanoFuenteOpciones = TAMANO_FUENTE_OPCIONES;
  protected readonly espaciadoLineasOpciones = ESPACIADO_LINEAS_OPCIONES;
  protected readonly anchoLecturaOpciones = ANCHO_LECTURA_OPCIONES;

  private readonly preferenciasResource = rxResource({
    stream: () => this.preferenciasService.obtenerPreferencias(),
  });
  protected readonly loading = this.preferenciasResource.isLoading;
  protected readonly error = computed(() => this.preferenciasResource.error() !== undefined);

  protected readonly tema = signal(3);
  protected readonly tipografia = signal(1);
  protected readonly tamanoFuente = signal(2);
  protected readonly espaciadoLineas = signal(2);
  protected readonly anchoLectura = signal(2);
  protected readonly intensidadFondo = signal(0);
  protected readonly altoContraste = signal(false);
  protected readonly reducirAnimaciones = signal(false);

  constructor() {
    effect(() => {
      const preferencias = this.preferenciasResource.value();
      if (preferencias) {
        untracked(() => {
          this.actualizarFormulario(preferencias);
          this.aplicarEnVivo();
        });
      }
    });
  }

  protected onTemaChange(event: Event): void {
    this.tema.set(Number((event.target as HTMLSelectElement).value));
    this.aplicarEnVivo();
  }

  protected onTipografiaChange(event: Event): void {
    this.tipografia.set(Number((event.target as HTMLSelectElement).value));
    this.aplicarEnVivo();
  }

  protected onTamanoFuenteChange(event: Event): void {
    this.tamanoFuente.set(Number((event.target as HTMLSelectElement).value));
    this.aplicarEnVivo();
  }

  protected onEspaciadoLineasChange(event: Event): void {
    this.espaciadoLineas.set(Number((event.target as HTMLSelectElement).value));
    this.aplicarEnVivo();
  }

  protected onAnchoLecturaChange(event: Event): void {
    this.anchoLectura.set(Number((event.target as HTMLSelectElement).value));
    this.aplicarEnVivo();
  }

  protected onIntensidadFondoChange(event: Event): void {
    this.intensidadFondo.set(Number((event.target as HTMLInputElement).value));
    this.aplicarEnVivo();
  }

  protected onAltoContrasteChange(event: Event): void {
    this.altoContraste.set((event.target as HTMLInputElement).checked);
    this.aplicarEnVivo();
  }

  protected onReducirAnimacionesChange(event: Event): void {
    this.reducirAnimaciones.set((event.target as HTMLInputElement).checked);
    this.aplicarEnVivo();
  }

  private readonly guardarAction = asyncAction(
    (dto: Preferencias) => this.preferenciasService.actualizarPreferencias(dto),
    {
      onSuccess: (preferencias) => {
        this.actualizarFormulario(preferencias);
        this.aplicarEnVivo();
      },
      defaultErrorMessage: 'No se han podido guardar las preferencias.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly guardarError = this.guardarAction.error;
  protected readonly guardadoOk = this.guardarAction.success;

  protected guardar(): void {
    this.guardarAction.run({
      tema: this.tema(),
      tipografia: this.tipografia(),
      tamanoFuente: this.tamanoFuente(),
      espaciadoLineas: this.espaciadoLineas(),
      anchoLectura: this.anchoLectura(),
      intensidadFondo: this.intensidadFondo(),
      altoContraste: this.altoContraste(),
      reducirAnimaciones: this.reducirAnimaciones(),
    });
  }

  private aplicarEnVivo(): void {
    this.preferenciasAplicadas.aplicar({
      tema: this.tema(),
      tipografia: this.tipografia(),
      tamanoFuente: this.tamanoFuente(),
      espaciadoLineas: this.espaciadoLineas(),
      anchoLectura: this.anchoLectura(),
      intensidadFondo: this.intensidadFondo(),
      altoContraste: this.altoContraste(),
      reducirAnimaciones: this.reducirAnimaciones(),
    });
  }

  private actualizarFormulario(preferencias: Preferencias): void {
    this.tema.set(preferencias.tema);
    this.tipografia.set(preferencias.tipografia);
    this.tamanoFuente.set(preferencias.tamanoFuente);
    this.espaciadoLineas.set(preferencias.espaciadoLineas);
    this.anchoLectura.set(preferencias.anchoLectura);
    this.intensidadFondo.set(preferencias.intensidadFondo);
    this.altoContraste.set(preferencias.altoContraste);
    this.reducirAnimaciones.set(preferencias.reducirAnimaciones);
  }
}
