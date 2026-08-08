import { Component, computed, effect, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { CANTIDAD_DECISION_OPCIONES } from '../../../home/models/universo.model';
import { asyncAction } from '../../../../core/utils/async-action';
import { AutorService } from '../../data-access/autor.service';
import { AventuraAutor } from '../../models/autor.model';

@Component({
  selector: 'app-aventura-form',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './aventura-form.component.html',
  styleUrl: './aventura-form.component.scss',
})
export class AventuraFormComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly autorService = inject(AutorService);
  private readonly fb = inject(FormBuilder);

  protected readonly cantidadDecisionOpciones = CANTIDAD_DECISION_OPCIONES;
  protected readonly tabActiva = signal<'datos' | 'contenido'>('datos');

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
  });

  private readonly aventuraResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => (params ? this.autorService.getAventura(params) : of(null)),
  });
  protected readonly cargando = this.aventuraResource.isLoading;

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
      const { titulo, descripcion, orden, cantidadDecision, rutaImagen } = this.form.getRawValue();
      const dto = {
        titulo,
        descripcion: descripcion.trim() || null,
        orden,
        cantidadDecision,
        rutaImagen: rutaImagen.trim() || null,
      };

      const id = this.idAventura();
      return id ? this.autorService.actualizarAventura(id, dto) : this.autorService.crearAventura(this.idCampana, dto);
    },
    {
      onSuccess: () => void this.router.navigate(['/autor']),
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

  private precargarFormulario(aventura: AventuraAutor): void {
    this.form.patchValue({
      titulo: aventura.titulo,
      descripcion: aventura.descripcion ?? '',
      orden: aventura.orden,
      cantidadDecision: aventura.cantidadDecision,
      rutaImagen: aventura.rutaImagen ?? '',
    });
  }
}
