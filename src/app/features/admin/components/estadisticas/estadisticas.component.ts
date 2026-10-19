import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { AdminService } from '../../data-access/admin.service';
import { ColaboradorAdmin, EstadisticaAventuraAdmin } from '../../models/admin.model';
import { escribirImporte } from '../../utils/importe';

type Agrupacion = 'universo' | 'campana' | 'aventura';
type Columna =
  | 'nombre'
  | 'partidasEmpezadas'
  | 'completadas'
  | 'porcentajeFinalizacion'
  | 'duracionMediaMinutos'
  | 'compras'
  | 'ingresos'
  | 'valoraciones'
  | 'mediaValoraciones';

/** Una fila del grid: una aventura, o la suma de las de una campaña o un universo. */
interface FilaEstadistica {
  clave: string;
  universo: string;
  campana: string | null;
  aventura: string | null;
  esLibro: boolean;
  visible: boolean;
  /** Orden original (universo, campaña, orden): el del grid sin ordenar por columna. */
  posicion: number;
  partidasEmpezadas: number;
  completadas: number;
  porcentajeFinalizacion: number | null;
  duracionMediaMinutos: number | null;
  compras: number;
  ingresos: number;
  valoraciones: number;
  mediaValoraciones: number | null;
}

export const AGRUPACIONES: { valor: Agrupacion; etiqueta: string }[] = [
  { valor: 'aventura', etiqueta: 'Aventura' },
  { valor: 'campana', etiqueta: 'Campaña' },
  { valor: 'universo', etiqueta: 'Universo' },
];

@Component({
  selector: 'app-estadisticas',
  imports: [DatePipe],
  templateUrl: './estadisticas.component.html',
  styleUrl: './estadisticas.component.scss',
})
export class EstadisticasComponent {
  private readonly adminService = inject(AdminService);

  private readonly estadisticasResource = rxResource({
    stream: () => this.adminService.obtenerEstadisticas(),
  });
  protected readonly estadisticas = this.estadisticasResource.value;
  protected readonly cargando = this.estadisticasResource.isLoading;
  protected readonly error = this.estadisticasResource.error;

  protected readonly agrupaciones = AGRUPACIONES;
  protected readonly agrupacion = signal<Agrupacion>('aventura');
  protected readonly columna = signal<Columna | null>(null);
  protected readonly descendente = signal(true);

  /** Colaborador al que se va a quitar el rol, a la espera de confirmar. */
  protected readonly quitando = signal<number | null>(null);
  protected readonly quitarAction = asyncAction(
    (colaborador: ColaboradorAdmin) =>
      this.adminService.quitarRol(colaborador.idUsuario, this.estadisticas()!.idRolColaborador!),
    {
      onSuccess: () => {
        this.quitando.set(null);
        this.estadisticasResource.reload();
      },
      defaultErrorMessage: 'No se ha podido quitar el rol.',
    },
  );

  protected readonly porcentajeFinalizacion = computed(() => {
    const e = this.estadisticas();
    return e ? this.porcentaje(e.aventurasCompletadas, e.partidasEmpezadas) : null;
  });

  protected readonly porcentajeConversion = computed(() => {
    const e = this.estadisticas();
    return e ? this.porcentaje(e.pruebasConvertidas, e.pruebasTerminadas) : null;
  });

  protected readonly filas = computed(() => {
    const aventuras = this.estadisticas()?.aventuras ?? [];
    const filas = this.agrupar(aventuras, this.agrupacion());
    const columna = this.columna();
    if (columna === null) {
      return filas;
    }

    const signo = this.descendente() ? -1 : 1;
    return [...filas].sort((a, b) => {
      if (columna === 'nombre') {
        return signo * this.nombre(a).localeCompare(this.nombre(b), 'es');
      }
      // Los vacíos (sin valoraciones, sin partidas terminadas…) siempre al final.
      const va = a[columna];
      const vb = b[columna];
      if (va === null || vb === null) {
        return va === vb ? a.posicion - b.posicion : va === null ? 1 : -1;
      }
      return signo * (va - vb) || a.posicion - b.posicion;
    });
  });

  protected onAgrupacionChange(event: Event): void {
    this.agrupacion.set((event.target as HTMLSelectElement).value as Agrupacion);
  }

  /** Primer clic: de mayor a menor (el nombre, de la A a la Z); segundo, al revés; tercero, orden original. */
  protected ordenarPor(columna: Columna): void {
    if (this.columna() !== columna) {
      this.columna.set(columna);
      this.descendente.set(columna !== 'nombre');
    } else if (this.descendente() === (columna !== 'nombre')) {
      this.descendente.set(!this.descendente());
    } else {
      this.columna.set(null);
    }
  }

  protected indicador(columna: Columna): string {
    if (this.columna() !== columna) {
      return '';
    }
    return this.descendente() ? ' ▼' : ' ▲';
  }

  protected ordenAria(columna: Columna): 'ascending' | 'descending' | 'none' {
    if (this.columna() !== columna) {
      return 'none';
    }
    return this.descendente() ? 'descending' : 'ascending';
  }

  protected euros(valor: number): string {
    return `${escribirImporte(valor)} €`;
  }

  protected media(valor: number | null): string {
    return valor === null ? '—' : valor.toFixed(2).replace('.', ',');
  }

  protected porcentajeTexto(valor: number | null): string {
    return valor === null ? '—' : `${Math.round(valor)} %`;
  }

  protected duracion(minutos: number | null): string {
    if (minutos === null) {
      return '—';
    }
    const horas = Math.floor(minutos / 60);
    return horas > 0 ? `${horas} h ${minutos % 60} min` : `${minutos} min`;
  }

  private nombre(fila: FilaEstadistica): string {
    return [fila.universo, fila.campana, fila.aventura].filter((t) => t !== null).join(' / ');
  }

  private porcentaje(parte: number, total: number): number | null {
    return total === 0 ? null : (parte / total) * 100;
  }

  // Suma las aventuras de cada grupo. Las medias se ponderan: la duración por las partidas
  // completadas y la valoración por el número de valoraciones.
  private agrupar(aventuras: EstadisticaAventuraAdmin[], agrupacion: Agrupacion): FilaEstadistica[] {
    const grupos = new Map<string, EstadisticaAventuraAdmin[]>();
    for (const aventura of aventuras) {
      const clave =
        agrupacion === 'universo'
          ? `u${aventura.idUniverso}`
          : agrupacion === 'campana'
            ? `c${aventura.idCampana}`
            : `a${aventura.idAventura}`;
      grupos.set(clave, [...(grupos.get(clave) ?? []), aventura]);
    }

    return [...grupos.entries()].map(([clave, grupo], posicion) => {
      const primera = grupo[0];
      const suma = (valor: (a: EstadisticaAventuraAdmin) => number) => grupo.reduce((total, a) => total + valor(a), 0);
      const partidasEmpezadas = suma((a) => a.partidasEmpezadas);
      const completadas = suma((a) => a.completadas);
      const valoraciones = suma((a) => a.valoraciones);
      const conDuracion = grupo.filter((a) => a.duracionMediaMinutos !== null);
      const pesoDuracion = conDuracion.reduce((total, a) => total + a.completadas, 0);

      return {
        clave,
        universo: primera.tituloUniverso,
        campana: agrupacion === 'universo' ? null : primera.tituloCampana,
        aventura: agrupacion === 'aventura' ? `${primera.orden}. ${primera.tituloAventura}` : null,
        esLibro: agrupacion === 'aventura' && primera.esLibro,
        visible: agrupacion !== 'aventura' || primera.visible,
        posicion,
        partidasEmpezadas,
        completadas,
        porcentajeFinalizacion: this.porcentaje(completadas, partidasEmpezadas),
        duracionMediaMinutos:
          pesoDuracion === 0
            ? null
            : Math.round(conDuracion.reduce((total, a) => total + a.duracionMediaMinutos! * a.completadas, 0) / pesoDuracion),
        compras: suma((a) => a.compras),
        ingresos: suma((a) => a.ingresos),
        valoraciones,
        mediaValoraciones:
          valoraciones === 0 ? null : suma((a) => (a.mediaValoraciones ?? 0) * a.valoraciones) / valoraciones,
      };
    });
  }
}
