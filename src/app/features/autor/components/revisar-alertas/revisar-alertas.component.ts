import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { AlertaService } from '../../../alertas/data-access/alerta.service';

/**
 * Pestaña «Revisar alertas» del editor: los errores que han informado los revisores, agrupados por
 * nodo, con el nodo del que venían y la captura de características y eventos para reproducirlos.
 */
@Component({
  selector: 'app-revisar-alertas',
  imports: [DatePipe, RouterLink],
  templateUrl: './revisar-alertas.component.html',
  styleUrl: './revisar-alertas.component.scss',
})
export class RevisarAlertasComponent {
  private readonly alertaService = inject(AlertaService);

  readonly idAventura = input.required<number>();

  private readonly alertasResource = rxResource({
    params: () => this.idAventura(),
    stream: ({ params }) => this.alertaService.getDeAventura(params),
  });
  protected readonly nodos = this.alertasResource.value;
  protected readonly cargando = this.alertasResource.isLoading;
  protected readonly errorCarga = this.alertasResource.error;

  private readonly cerrarAction = asyncAction((idNodo: number) => this.alertaService.cerrarDeNodo(idNodo), {
    onSuccess: () => this.alertasResource.reload(),
    defaultErrorMessage: 'No se han podido cerrar las alertas.',
  });
  protected readonly cerrando = this.cerrarAction.loading;
  protected readonly errorCerrar = this.cerrarAction.error;

  protected cerrar(idNodo: number): void {
    this.cerrarAction.run(idNodo);
  }
}
