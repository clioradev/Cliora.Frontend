import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  private readonly destroyRef = inject(DestroyRef);

  protected readonly temaOpciones = TEMA_OPCIONES;
  protected readonly tipografiaOpciones = TIPOGRAFIA_OPCIONES;
  protected readonly tamanoFuenteOpciones = TAMANO_FUENTE_OPCIONES;
  protected readonly espaciadoLineasOpciones = ESPACIADO_LINEAS_OPCIONES;
  protected readonly anchoLecturaOpciones = ANCHO_LECTURA_OPCIONES;

  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly guardando = signal(false);
  protected readonly guardadoOk = signal(false);
  protected readonly guardarError = signal<string | null>(null);

  protected readonly tema = signal(3);
  protected readonly tipografia = signal(1);
  protected readonly tamanoFuente = signal(2);
  protected readonly espaciadoLineas = signal(2);
  protected readonly anchoLectura = signal(2);
  protected readonly intensidadFondo = signal(0);
  protected readonly altoContraste = signal(false);
  protected readonly reducirAnimaciones = signal(false);

  constructor() {
    this.preferenciasService
      .obtenerPreferencias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (preferencias) => {
          this.actualizarFormulario(preferencias);
          this.aplicarEnVivo();
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
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

  protected guardar(): void {
    if (this.guardando()) {
      return;
    }

    this.guardando.set(true);
    this.guardarError.set(null);
    this.guardadoOk.set(false);

    this.preferenciasService
      .actualizarPreferencias({
        tema: this.tema(),
        tipografia: this.tipografia(),
        tamanoFuente: this.tamanoFuente(),
        espaciadoLineas: this.espaciadoLineas(),
        anchoLectura: this.anchoLectura(),
        intensidadFondo: this.intensidadFondo(),
        altoContraste: this.altoContraste(),
        reducirAnimaciones: this.reducirAnimaciones(),
      })
      .subscribe({
        next: (preferencias) => {
          this.actualizarFormulario(preferencias);
          this.aplicarEnVivo();
          this.guardando.set(false);
          this.guardadoOk.set(true);
        },
        error: () => {
          this.guardando.set(false);
          this.guardarError.set('No se han podido guardar las preferencias.');
        },
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
