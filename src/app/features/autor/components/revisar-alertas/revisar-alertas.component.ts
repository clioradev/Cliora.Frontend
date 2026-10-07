import { DatePipe } from '@angular/common';
import { Component, inject, input } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { descargarJson } from '../../../../core/utils/descargar';
import { AlertaService } from '../../../alertas/data-access/alerta.service';
import { AlertaNodo, NodoConAlertas } from '../../../alertas/models/alerta.model';

/**
 * Pestaña «Revisar alertas» del editor: los errores que han informado los revisores, agrupados por
 * nodo, con el nodo del que venían y la captura de características y eventos para reproducirlos.
 * Cada alerta (o todas) se puede exportar a JSON para revisarla fuera, con todo el contexto.
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
  readonly tituloAventura = input('');

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

  protected exportar(item: NodoConAlertas, alerta: AlertaNodo): void {
    descargarJson(
      { ...this.cabeceraExportacion(), alertas: [this.alertaExportada(item, alerta)] },
      `alerta-${item.nodo.codigo}-${alerta.idAlertaNodo}.json`,
    );
  }

  protected exportarTodas(): void {
    const alertas = (this.nodos() ?? []).flatMap((item) => item.alertas.map((alerta) => this.alertaExportada(item, alerta)));
    descargarJson({ ...this.cabeceraExportacion(), alertas }, `alertas-aventura-${this.idAventura()}.json`);
  }

  // El mismo formato para una o para todas: una lista de alertas, cada una con su nodo completo.
  private cabeceraExportacion() {
    return {
      aventura: { idAventura: this.idAventura(), titulo: this.tituloAventura() },
      exportado: new Date().toISOString(),
    };
  }

  private alertaExportada(item: NodoConAlertas, alerta: AlertaNodo) {
    return {
      nodo: {
        idNodo: item.nodo.idNodo,
        codigo: item.nodo.codigo,
        titulo: item.nodo.titulo,
        acto: item.actoTitulo,
        escena: item.escenaTitulo,
        version: item.version,
        idNodoEdicion: item.idNodoEdicion,
      },
      ...alerta,
    };
  }
}
