import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { EconomiaService } from '../../data-access/economia.service';
import { Categoria, CategoriaIngresosAutor, NOMBRE_CATEGORIA } from '../../models/economia.model';
import { euros, nombreMes, numero, porcentaje } from '../../utils/formato';

/** Autor › Mis ingresos: lo que cobrará (provisional), lo liquidado, lo pagado y cómo va cada aventura. */
@Component({
  selector: 'app-mis-ingresos',
  imports: [DatePipe, RouterLink],
  templateUrl: './mis-ingresos.component.html',
  styleUrl: './mis-ingresos.component.scss',
})
export class MisIngresosComponent {
  private readonly economiaService = inject(EconomiaService);

  private readonly panelResource = rxResource({ stream: () => this.economiaService.obtenerMisIngresos() });
  protected readonly panel = this.panelResource.value;
  protected readonly cargando = this.panelResource.isLoading;
  protected readonly error = this.panelResource.error;

  protected readonly euros = euros;
  protected readonly numero = numero;
  protected readonly porcentaje = porcentaje;
  protected readonly nombreMes = nombreMes;

  protected nombreCategoria(categoria: Categoria): string {
    return NOMBRE_CATEGORIA[categoria];
  }

  protected esSuscripcion(c: CategoriaIngresosAutor): boolean {
    return c.categoria !== Categoria.Adulto;
  }
}
