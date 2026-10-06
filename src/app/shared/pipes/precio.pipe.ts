import { Pipe, PipeTransform } from '@angular/core';

const FORMATO_EUROS = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' });

/** Importe en euros con formato español: 1,99 €. */
@Pipe({ name: 'precio' })
export class PrecioPipe implements PipeTransform {
  transform(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '' : FORMATO_EUROS.format(valor);
  }
}
