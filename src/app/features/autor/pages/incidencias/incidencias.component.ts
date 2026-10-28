import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AlertaService } from '../../../alertas/data-access/alerta.service';
import { AventuraConAlertas } from '../../../alertas/models/alerta.model';

/**
 * «Incidencias»: las aventuras del autor con alertas abiertas de los revisores, para no tener que
 * entrar una por una en «Revisar alertas». Cada fila abre esas alertas en su propia página.
 */
@Component({
  selector: 'app-incidencias',
  imports: [DatePipe, RouterLink, IconoComponent],
  templateUrl: './incidencias.component.html',
  styleUrl: './incidencias.component.scss',
})
export class IncidenciasComponent {
  private readonly alertaService = inject(AlertaService);

  private readonly aventurasResource = rxResource({
    stream: () => this.alertaService.getAventurasConAlertas(),
    defaultValue: [] as AventuraConAlertas[],
  });
  protected readonly aventuras = this.aventurasResource.value;
  protected readonly cargando = this.aventurasResource.isLoading;
  protected readonly error = this.aventurasResource.error;
}
