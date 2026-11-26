import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import { PARAMETRO_PRECIO_AVENTURA_INTERACTIVA, PARAMETRO_PRECIO_LIBRO, ParametroAdmin } from '../../models/admin.model';
import { escribirImporte, leerImporte } from '../../utils/importe';

const NOMBRES: Record<string, string> = {
  DESCUENTO_CAMPANA: 'Descuento por comprar la campaña entera (%)',
  UMBRAL_DEVOLUCION: 'Progreso a partir del que no se puede devolver (%)',
  VALORACIONES_POR_AVENTURA_GRATIS: 'Valoraciones para conseguir una aventura gratis',
  [PARAMETRO_PRECIO_AVENTURA_INTERACTIVA]: 'Precio por defecto de una aventura interactiva (€)',
  [PARAMETRO_PRECIO_LIBRO]: 'Precio por defecto de un libro (€)',
  PRECIO_SUSCRIPCION_INFANTIL: 'Suscripción infantil al mes (€)',
  PRECIO_SUSCRIPCION_JUVENIL: 'Suscripción juvenil al mes (€)',
  PRECIO_SUSCRIPCION_AMBAS: 'Suscripción infantil y juvenil al mes (€)',
  // Economía (Admin › Economía)
  PORCENTAJE_AUTOR_ADULTO: 'Economía · Adultos: parte del autor sin contrato propio (%)',
  PORCENTAJE_PLATAFORMA_SUSCRIPCION: 'Economía · Suscripciones: parte de Cliora como plataforma (%)',
  REPARTO_AMBAS_INFANTIL: 'Economía · Suscripción de ambos tramos: parte del fondo infantil (%)',
  IVA_VENTAS: 'Economía · IVA incluido en los precios (%)',
  COMISION_WEB_PORCENTAJE: 'Economía · Comisión estimada de la web (%)',
  COMISION_WEB_FIJA: 'Economía · Comisión fija estimada de la web por cobro (€)',
  COMISION_TIENDAS_PORCENTAJE: 'Economía · Comisión estimada de App Store y Google Play (%)',
  MINUTOS_POR_PUNTO: 'Economía · Minutos por punto de lectura',
  LECTURAS_REMUNERADAS_MES: 'Economía · Lecturas remuneradas por perfil, aventura y mes',
  PAGO_MINIMO_AUTOR: 'Economía · Pago mínimo a un autor (€)',
  TIEMPO_MINIMO_LECTURA: 'Economía · Lectura imposible por debajo de (% de la duración)',
  SEGUNDOS_POR_IMAGEN: 'Economía · Duración: segundos por ilustración',
  SEGUNDOS_POR_DECISION: 'Economía · Duración: segundos por decisión',
  PALABRAS_MINUTO_INFANTIL: 'Economía · Duración: palabras por minuto en infantil',
  PALABRAS_MINUTO_JUVENIL: 'Economía · Duración: palabras por minuto en juvenil',
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
