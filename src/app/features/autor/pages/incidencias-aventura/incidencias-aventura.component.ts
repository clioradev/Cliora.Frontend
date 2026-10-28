import { Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AlertaService } from '../../../alertas/data-access/alerta.service';
import { RevisarAlertasComponent } from '../../components/revisar-alertas/revisar-alertas.component';

/**
 * Las alertas de una aventura abiertas desde «Incidencias»: el mismo componente que la pestaña
 * «Revisar alertas» del editor, pero solo, para que al volver del nodo se regrese aquí.
 */
@Component({
  selector: 'app-incidencias-aventura',
  imports: [RouterLink, IconoComponent, RevisarAlertasComponent],
  templateUrl: './incidencias-aventura.component.html',
  styleUrl: './incidencias-aventura.component.scss',
})
export class IncidenciasAventuraComponent {
  private readonly alertaService = inject(AlertaService);

  protected readonly idAventura = Number(inject(ActivatedRoute).snapshot.paramMap.get('idAventura'));
  protected readonly volverA = `/autor/incidencias/${this.idAventura}`;

  // El título sale del mismo listado de Incidencias (es ligero); si ya no tiene alertas, no aparece.
  private readonly aventurasResource = rxResource({
    stream: () => this.alertaService.getAventurasConAlertas(),
  });
  protected readonly aventura = computed(
    () => this.aventurasResource.value()?.find((a) => a.idAventura === this.idAventura) ?? null,
  );
}
