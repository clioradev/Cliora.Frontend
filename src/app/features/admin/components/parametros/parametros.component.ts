import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import { PARAMETRO_PRECIO_AVENTURA_INTERACTIVA, ParametroAdmin } from '../../models/admin.model';
import { escribirImporte, leerImporte } from '../../utils/importe';

const NOMBRES: Record<string, string> = {
  DESCUENTO_CAMPANA: 'Descuento por comprar la campaña entera (%)',
  UMBRAL_DEVOLUCION: 'Progreso a partir del que no se puede devolver (%)',
  [PARAMETRO_PRECIO_AVENTURA_INTERACTIVA]: 'Precio por defecto de una aventura interactiva (€)',
};

@Component({
  selector: 'app-parametros',
  templateUrl: './parametros.component.html',
  styleUrl: './parametros.component.scss',
})
export class ParametrosComponent {
  private readonly adminService = inject(AdminService);

  private readonly parametrosResource = rxResource({
    stream: () => this.adminService.obtenerParametros(),
    defaultValue: [] as ParametroAdmin[],
  });
  protected readonly parametros = this.parametrosResource.value;
  protected readonly cargando = this.parametrosResource.isLoading;

  protected readonly guardado = signal<string | null>(null);
  protected readonly errorValidacion = signal<string | null>(null);

  private readonly guardarAction = asyncAction(
    (codigo: string, valor: number) => this.adminService.guardarParametro(codigo, valor),
    {
      onSuccess: (_, codigo) => {
        this.guardado.set(codigo);
        this.parametrosResource.reload();
      },
      defaultErrorMessage: 'No se ha podido guardar el parámetro.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly errorGuardar = this.guardarAction.error;

  protected nombre(parametro: ParametroAdmin): string {
    return NOMBRES[parametro.codigo] ?? parametro.codigo;
  }

  protected valorTexto(parametro: ParametroAdmin): string {
    return escribirImporte(parametro.valor).replace(/,00$/, '');
  }

  protected guardar(parametro: ParametroAdmin, texto: string): void {
    const valor = leerImporte(texto);
    if (valor === undefined || valor === null) {
      this.errorValidacion.set(`${this.nombre(parametro)}: escribe un número (por ejemplo 25 o 1,99).`);
      return;
    }
    this.errorValidacion.set(null);
    this.guardado.set(null);
    this.guardarAction.run(parametro.codigo, valor);
  }
}
