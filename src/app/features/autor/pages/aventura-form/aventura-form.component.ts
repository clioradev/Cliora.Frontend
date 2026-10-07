import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { CANTIDAD_DECISION_OPCIONES } from '../../../home/models/universo.model';
import { asyncAction } from '../../../../core/utils/async-action';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { ActosEscenasComponent } from '../../components/actos-escenas/actos-escenas.component';
import { CaracteristicasComponent } from '../../components/caracteristicas/caracteristicas.component';
import { RevisarAlertasComponent } from '../../components/revisar-alertas/revisar-alertas.component';
import { AutorService } from '../../data-access/autor.service';
import { AventuraAutor, EnumEstadoPublicacion, InformeImportacion } from '../../models/autor.model';

@Component({
  selector: 'app-aventura-form',
  imports: [AreaTextoComponent, ReactiveFormsModule, RouterLink, IconoComponent, ModalComponent, ActosEscenasComponent, CaracteristicasComponent, RevisarAlertasComponent, DatePipe],
  templateUrl: './aventura-form.component.html',
  styleUrl: './aventura-form.component.scss',
})
export class AventuraFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autorService = inject(AutorService);
  private readonly fb = inject(FormBuilder);

  protected readonly cantidadDecisionOpciones = CANTIDAD_DECISION_OPCIONES;
  protected readonly tabActiva = signal<'datos' | 'contenido' | 'caracteristicas' | 'alertas'>(
    tabInicial(this.route.snapshot.queryParamMap.get('tab')),
  );

  protected readonly idAventura = computed(() => {
    const param = this.route.snapshot.paramMap.get('id');
    return param ? Number(param) : null;
  });

  private readonly idCampana = Number(this.route.snapshot.queryParamMap.get('idCampana'));
  // EsLibro se decide una única vez, al crear (ver panel-autor): en creación viene del query param;
  // en edición, de la propia aventura cargada. Nunca se envía al actualizar.
  private readonly esLibroCreacion = this.route.snapshot.queryParamMap.get('esLibro') === 'true';
  protected readonly esLibro = computed(() => this.aventura()?.esLibro ?? this.esLibroCreacion);

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    orden: [1, [Validators.required, Validators.min(1)]],
    cantidadDecision: this.fb.control<number | null>(2),
    duracion: this.fb.control<number | null>(null, [Validators.min(0)]),
    enlaceCompra: [''],
  });

  protected readonly caratulaUrl = signal<string | null>(null);

  private readonly aventuraResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => (params ? this.autorService.getAventura(params) : of(null)),
  });
  protected readonly cargando = this.aventuraResource.isLoading;
  protected readonly aventura = this.aventuraResource.value;

  protected recargarContenido(): void {
    this.aventuraResource.reload();
  }

  constructor() {
    effect(() => {
      const aventura = this.aventuraResource.value();
      if (aventura) {
        this.precargarFormulario(aventura);
      } else if (!this.idAventura()) {
        this.autorService.getSiguienteOrden(this.idCampana).subscribe((orden) => this.form.patchValue({ orden }));
      }
    });

    // cantidadDecision solo es obligatoria para aventuras interactivas; en un libro el campo ni
    // siquiera se muestra. Se recalcula cada vez que esLibro() cambia (p. ej. al cargar la aventura
    // en modo edición, que es cuando se sabe con certeza si es un libro).
    effect(() => {
      const control = this.form.controls.cantidadDecision;
      if (this.esLibro()) {
        control.clearValidators();
      } else {
        control.setValidators(Validators.required);
      }
      control.updateValueAndValidity({ emitEvent: false });
    });
  }

  private readonly guardarAction = asyncAction(
    () => {
      const { titulo, descripcion, orden, cantidadDecision, duracion, enlaceCompra } = this.form.getRawValue();
      const dto = {
        titulo,
        descripcion: descripcion.trim() || null,
        orden,
        cantidadDecision,
        duracion: duracion ?? null,
        enlaceCompra: enlaceCompra.trim() || null,
      };

      const id = this.idAventura();
      return id
        ? this.autorService.actualizarAventura(id, dto)
        : this.autorService.crearAventura(this.idCampana, { ...dto, esLibro: this.esLibroCreacion });
    },
    {
      onSuccess: (aventura) => {
        if (this.idAventura()) {
          this.precargarFormulario(aventura);
        } else {
          void this.router.navigate(['/autor/aventura', aventura.idAventura], { replaceUrl: true });
        }
      },
      defaultErrorMessage: 'No se ha podido guardar la aventura.',
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

  private readonly calcularDuracionAction = asyncAction(
    () => this.autorService.calcularDuracionAventura(this.idAventura()!),
    {
      onSuccess: () => this.aventuraResource.reload(),
      defaultErrorMessage: 'No se ha podido calcular la duración.',
    },
  );
  protected readonly calculandoDuracion = this.calcularDuracionAction.loading;
  protected readonly errorDuracion = this.calcularDuracionAction.error;

  protected calcularDuracion(): void {
    this.calcularDuracionAction.run();
  }

  private readonly previsualizarAction = asyncAction(() => this.autorService.previsualizarAventura(this.idAventura()!), {
    onSuccess: (respuesta) => {
      void this.router.navigate(['/partida', respuesta.idNodoActual], {
        queryParams: { idAventura: this.idAventura(), preview: true },
      });
    },
    defaultErrorMessage: 'No se ha podido previsualizar la aventura.',
  });
  protected readonly previsualizando = this.previsualizarAction.loading;
  protected readonly errorPrevisualizar = this.previsualizarAction.error;

  protected previsualizar(): void {
    this.previsualizarAction.run();
  }

  protected readonly estadoVersion = computed(() => this.aventura()?.estadoVersionEdicion ?? null);
  protected readonly esSolicitudPendiente = computed(
    () => this.estadoVersion() === EnumEstadoPublicacion.SolicitudPublicacion,
  );
  protected readonly fechaSolicitud = computed(() => this.aventura()?.fechaSolicitudPublicacion ?? null);

  private readonly solicitarPublicacionAction = asyncAction(
    () => this.autorService.solicitarPublicacion(this.idAventura()!),
    {
      onSuccess: () => this.aventuraResource.reload(),
      defaultErrorMessage: 'No se ha podido solicitar la publicación.',
    },
  );
  protected readonly solicitandoPublicacion = this.solicitarPublicacionAction.loading;
  protected readonly errorSolicitarPublicacion = this.solicitarPublicacionAction.error;

  protected solicitarPublicacion(): void {
    this.solicitarPublicacionAction.run();
  }

  private readonly cancelarSolicitudAction = asyncAction(
    () => this.autorService.cancelarSolicitudPublicacion(this.idAventura()!),
    {
      onSuccess: () => this.aventuraResource.reload(),
      defaultErrorMessage: 'No se ha podido cancelar la solicitud.',
    },
  );
  protected readonly cancelandoSolicitud = this.cancelarSolicitudAction.loading;

  protected cancelarSolicitud(): void {
    this.cancelarSolicitudAction.run();
  }

  private readonly subirCaratulaAction = asyncAction(
    (archivo: File) => this.autorService.subirImagenAventura(this.idAventura()!, archivo),
    {
      onSuccess: (aventura) => this.caratulaUrl.set(aventura.caratulaUrl),
      defaultErrorMessage: 'No se ha podido subir la carátula.',
    },
  );
  protected readonly subiendoCaratula = this.subirCaratulaAction.loading;

  private readonly quitarCaratulaAction = asyncAction(
    () => this.autorService.eliminarImagenAventura(this.idAventura()!),
    {
      onSuccess: (aventura) => this.caratulaUrl.set(aventura.caratulaUrl),
      defaultErrorMessage: 'No se ha podido quitar la carátula.',
    },
  );
  protected readonly quitandoCaratula = this.quitarCaratulaAction.loading;

  protected readonly errorCaratula = computed(() => this.subirCaratulaAction.error() ?? this.quitarCaratulaAction.error());

  protected seleccionarCaratula(files: FileList | null): void {
    const archivo = files?.[0];
    if (archivo) {
      this.subirCaratulaAction.run(archivo);
    }
  }

  protected quitarCaratula(): void {
    this.quitarCaratulaAction.run();
  }

  // Importar: primero se valida el paquete sin tocar nada (dryRun) y, si es válido, se pide
  // confirmación antes de sustituir el contenido de la aventura por el del paquete.
  protected readonly importacionPendiente = signal<{ archivo: File; informe: InformeImportacion } | null>(null);
  protected readonly informeImportacion = signal<InformeImportacion | null>(null);

  private readonly validarImportacionAction = asyncAction(
    (archivo: File) => this.autorService.importarEnAventura(this.idAventura()!, archivo, true),
    {
      onSuccess: (informe, archivo) => {
        if (informe.exito) {
          this.importacionPendiente.set({ archivo, informe });
        } else {
          this.informeImportacion.set(informe);
        }
      },
      defaultErrorMessage: 'No se ha podido leer el paquete.',
    },
  );

  private readonly importarAction = asyncAction(
    (archivo: File) => this.autorService.importarEnAventura(this.idAventura()!, archivo),
    {
      onSuccess: (informe) => {
        this.importacionPendiente.set(null);
        this.informeImportacion.set(informe);
        this.aventuraResource.reload();
      },
      defaultErrorMessage: 'No se ha podido importar el paquete.',
    },
  );

  protected readonly importando = computed(() => this.validarImportacionAction.loading() || this.importarAction.loading());
  protected readonly errorImportar = computed(() => this.validarImportacionAction.error() ?? this.importarAction.error());

  protected seleccionarPaquete(files: FileList | null): void {
    const archivo = files?.[0];
    if (archivo) {
      this.informeImportacion.set(null);
      this.validarImportacionAction.run(archivo);
    }
  }

  protected confirmarImportacion(): void {
    const pendiente = this.importacionPendiente();
    if (pendiente) {
      this.importarAction.run(pendiente.archivo);
    }
  }

  protected cancelarImportacion(): void {
    if (!this.importarAction.loading()) {
      this.importacionPendiente.set(null);
    }
  }

  private readonly exportarAction = asyncAction(() => this.autorService.exportarAventura(this.idAventura()!), {
    onSuccess: (respuesta) => {
      if (respuesta.body) {
        const nombre = nombreArchivoDescarga(respuesta.headers.get('Content-Disposition')) ?? `aventura-${this.idAventura()}.zip`;
        descargar(respuesta.body, nombre);
      }
    },
    defaultErrorMessage: 'No se ha podido exportar la aventura.',
  });
  protected readonly exportando = this.exportarAction.loading;
  protected readonly errorExportar = this.exportarAction.error;

  protected exportar(): void {
    this.exportarAction.run();
  }

  private precargarFormulario(aventura: AventuraAutor): void {
    this.form.patchValue({
      titulo: aventura.titulo,
      descripcion: aventura.descripcion ?? '',
      orden: aventura.orden,
      cantidadDecision: aventura.cantidadDecision,
      duracion: aventura.duracion,
      enlaceCompra: aventura.enlaceCompra ?? '',
    });
    this.caratulaUrl.set(aventura.caratulaUrl);
  }
}

function tabInicial(tab: string | null): 'datos' | 'contenido' | 'alertas' {
  return tab === 'contenido' || tab === 'alertas' ? tab : 'datos';
}

/** Nombre del archivo de una cabecera Content-Disposition (filename*=UTF-8''… o filename=…). */
function nombreArchivoDescarga(cabecera: string | null): string | null {
  const codificado = cabecera?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (codificado) {
    return decodeURIComponent(codificado);
  }
  return cabecera?.match(/filename="?([^";]+)"?/i)?.[1] ?? null;
}

function descargar(contenido: Blob, nombre: string): void {
  const url = URL.createObjectURL(contenido);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  URL.revokeObjectURL(url);
}
