import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { asyncAction } from '../../../../core/utils/async-action';
import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AdminService } from '../../data-access/admin.service';
import { CambioTexto, CampoTexto, ElementoTexto, NodoTextos } from '../../models/admin.model';

type Pestana = 'datos' | 'contenido' | 'finales' | 'variables';

// Editor de textos del administrador: corrige erratas en la versión publicada de una aventura sin
// crear versión nueva ni tocar la estructura. Los cambios se acumulan en memoria (se pueden repartir
// entre pestañas y nodos) y se envían todos juntos con «Guardar».
@Component({
  selector: 'app-corregir-textos',
  imports: [FormsModule, RouterLink, AreaTextoComponent, IconoComponent, ModalComponent],
  templateUrl: './corregir-textos.component.html',
  styleUrl: './corregir-textos.component.scss',
})
export class CorregirTextosComponent {
  private readonly adminService = inject(AdminService);
  private readonly idAventura = Number(inject(ActivatedRoute).snapshot.paramMap.get('idAventura'));

  private readonly textosResource = rxResource({
    stream: () => this.adminService.obtenerTextosAventura(this.idAventura),
  });
  protected readonly textos = this.textosResource.value;
  protected readonly cargando = this.textosResource.isLoading;
  protected readonly errorCarga = computed(() => this.textosResource.error() !== undefined);

  protected readonly pestana = signal<Pestana>('datos');
  protected readonly nodoAbierto = signal<NodoTextos | null>(null);

  private readonly cambios = signal(new Map<string, CambioTexto>());
  protected readonly cantidadCambios = computed(() => this.cambios().size);

  protected valor(elemento: ElementoTexto, id: number, campo: CampoTexto, original: string | null): string {
    return this.cambios().get(clave(elemento, id, campo))?.valor ?? original ?? '';
  }

  protected modificado(elemento: ElementoTexto, id: number, campo: CampoTexto): boolean {
    return this.cambios().has(clave(elemento, id, campo));
  }

  protected editar(
    elemento: ElementoTexto,
    id: number,
    campo: CampoTexto,
    original: string | null,
    valor: string,
  ): void {
    const mapa = new Map(this.cambios());
    const k = clave(elemento, id, campo);
    // Volver al texto original deshace el cambio en vez de enviarlo igual.
    if (valor === (original ?? '')) {
      mapa.delete(k);
    } else {
      mapa.set(k, { elemento, id, campo, valor });
    }
    this.cambios.set(mapa);
    this.guardarAction.reset();
  }

  protected cambiosEnNodo(nodo: NodoTextos): number {
    const cambios = this.cambios();
    return (
      (cambios.has(clave('Nodo', nodo.idNodo, 'Titulo')) ? 1 : 0) +
      nodo.contenidos.filter((c) => cambios.has(clave('ContenidoNodo', c.idContenidoNodo, 'Texto'))).length +
      nodo.opciones.filter((o) => cambios.has(clave('Opcion', o.idOpcion, 'Texto'))).length
    );
  }

  protected descartar(): void {
    this.cambios.set(new Map());
    this.guardarAction.reset();
  }

  private readonly guardarAction = asyncAction(
    () => this.adminService.corregirTextosAventura(this.idAventura, [...this.cambios().values()]),
    {
      onSuccess: (textos) => {
        this.textosResource.set(textos);
        this.cambios.set(new Map());
        // El modal abierto apunta al nodo de la carga anterior: se cambia por el recién guardado.
        const abierto = this.nodoAbierto();
        if (abierto) {
          this.nodoAbierto.set(
            textos.actos
              .flatMap((a) => a.escenas)
              .flatMap((e) => e.nodos)
              .find((n) => n.idNodo === abierto.idNodo) ?? null,
          );
        }
      },
      defaultErrorMessage: 'No se han podido guardar las correcciones.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly errorGuardar = this.guardarAction.error;
  protected readonly guardadoOk = this.guardarAction.success;

  protected guardar(): void {
    if (this.cantidadCambios() > 0) {
      this.guardarAction.run();
    }
  }
}

function clave(elemento: ElementoTexto, id: number, campo: CampoTexto): string {
  return `${elemento}:${id}:${campo}`;
}
