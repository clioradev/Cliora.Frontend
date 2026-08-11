import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { CANTIDAD_DECISION_OPCIONES } from '../../../home/models/universo.model';
import { asyncAction } from '../../../../core/utils/async-action';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { ActosEscenasComponent } from '../../components/actos-escenas/actos-escenas.component';
import { CaracteristicasComponent } from '../../components/caracteristicas/caracteristicas.component';
import { AutorService } from '../../data-access/autor.service';
import { AventuraAutor } from '../../models/autor.model';

@Component({
  selector: 'app-aventura-form',
  imports: [ReactiveFormsModule, RouterLink, IconoComponent, ActosEscenasComponent, CaracteristicasComponent],
  templateUrl: './aventura-form.component.html',
  styleUrl: './aventura-form.component.scss',
})
export class AventuraFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autorService = inject(AutorService);
  private readonly fb = inject(FormBuilder);

  protected readonly cantidadDecisionOpciones = CANTIDAD_DECISION_OPCIONES;
  protected readonly tabActiva = signal<'datos' | 'contenido' | 'caracteristicas'>(
    this.route.snapshot.queryParamMap.get('tab') === 'contenido' ? 'contenido' : 'datos',
  );

  protected readonly idAventura = computed(() => {
    const param = this.route.snapshot.paramMap.get('id');
    return param ? Number(param) : null;
  });

  private readonly idCampana = Number(this.route.snapshot.queryParamMap.get('idCampana'));

  protected readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(200)]],
    descripcion: [''],
    orden: [1, [Validators.required, Validators.min(1)]],
    cantidadDecision: [2, [Validators.required]],
    rutaImagen: [''],
    duracion: this.fb.control<number | null>(null, [Validators.min(0)]),
  });

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
  }

  private readonly guardarAction = asyncAction(
    () => {
      const { titulo, descripcion, orden, cantidadDecision, rutaImagen, duracion } = this.form.getRawValue();
      const dto = {
        titulo,
        descripcion: descripcion.trim() || null,
        orden,
        cantidadDecision,
        rutaImagen: rutaImagen.trim() || null,
        duracion: duracion ?? null,
      };

      const id = this.idAventura();
      return id ? this.autorService.actualizarAventura(id, dto) : this.autorService.crearAventura(this.idCampana, dto);
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

  private precargarFormulario(aventura: AventuraAutor): void {
    this.form.patchValue({
      titulo: aventura.titulo,
      descripcion: aventura.descripcion ?? '',
      orden: aventura.orden,
      cantidadDecision: aventura.cantidadDecision,
      rutaImagen: aventura.rutaImagen ?? '',
      duracion: aventura.duracion,
    });
  }
}
