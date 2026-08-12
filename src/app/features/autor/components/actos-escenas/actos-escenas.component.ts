import { Component, effect, inject, input, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { AutorService } from '../../data-access/autor.service';
import { ActoAutor, EscenaAutor, NodoAutorResumen } from '../../models/autor.model';
import { ActoFormModalComponent } from '../acto-form-modal/acto-form-modal.component';
import { EscenaFormModalComponent } from '../escena-form-modal/escena-form-modal.component';

interface EscenaModalState {
  idActo: number;
  escena: EscenaAutor | null;
}

interface EliminarModalState {
  titulo: string;
  mensaje: string;
  accion: () => Observable<void>;
}

@Component({
  selector: 'app-actos-escenas',
  imports: [ActoFormModalComponent, EscenaFormModalComponent, ConfirmarEliminarModalComponent],
  templateUrl: './actos-escenas.component.html',
  styleUrl: './actos-escenas.component.scss',
})
export class ActosEscenasComponent {
  private readonly autorService = inject(AutorService);
  private readonly router = inject(Router);

  readonly idAventura = input.required<number>();
  readonly actos = input.required<ActoAutor[]>();
  readonly cambiado = output<void>();

  protected readonly actoModal = signal<ActoAutor | 'nuevo' | null>(null);
  protected readonly escenaModal = signal<EscenaModalState | null>(null);
  protected readonly eliminarModal = signal<EliminarModalState | null>(null);

  private static readonly LS_ACTOS_ABIERTOS = 'cliora:autor:actosAbiertos';
  private static readonly LS_ESCENAS_ABIERTAS = 'cliora:autor:escenasAbiertas';
  private static readonly LS_NODO_EDITANDO = 'cliora:autor:nodoEditando';

  protected readonly actosAbiertos = signal<Set<number>>(
    this.leerSetLocalStorage(ActosEscenasComponent.LS_ACTOS_ABIERTOS),
  );
  protected readonly escenasAbiertas = signal<Set<number>>(
    this.leerSetLocalStorage(ActosEscenasComponent.LS_ESCENAS_ABIERTAS),
  );

  constructor() {
    effect(() => {
      if (this.actos().length > 0) {
        this.irAlNodoEnEdicion();
      }
    });
  }

  private leerSetLocalStorage(clave: string): Set<number> {
    try {
      const raw = localStorage.getItem(clave);
      return raw ? new Set(JSON.parse(raw) as number[]) : new Set();
    } catch {
      return new Set();
    }
  }

  private guardarSetLocalStorage(clave: string, valores: Set<number>): void {
    localStorage.setItem(clave, JSON.stringify([...valores]));
  }

  protected actoAbierto(idActo: number): boolean {
    return this.actosAbiertos().has(idActo);
  }

  protected toggleActo(idActo: number): void {
    const set = new Set(this.actosAbiertos());
    set.has(idActo) ? set.delete(idActo) : set.add(idActo);
    this.actosAbiertos.set(set);
    this.guardarSetLocalStorage(ActosEscenasComponent.LS_ACTOS_ABIERTOS, set);
  }

  private abrirActo(idActo: number): void {
    if (this.actosAbiertos().has(idActo)) {
      return;
    }
    const set = new Set(this.actosAbiertos());
    set.add(idActo);
    this.actosAbiertos.set(set);
    this.guardarSetLocalStorage(ActosEscenasComponent.LS_ACTOS_ABIERTOS, set);
  }

  protected escenaAbierta(idEscena: number): boolean {
    return this.escenasAbiertas().has(idEscena);
  }

  protected toggleEscena(idEscena: number): void {
    const set = new Set(this.escenasAbiertas());
    set.has(idEscena) ? set.delete(idEscena) : set.add(idEscena);
    this.escenasAbiertas.set(set);
    this.guardarSetLocalStorage(ActosEscenasComponent.LS_ESCENAS_ABIERTAS, set);
  }

  private abrirEscena(idEscena: number): void {
    if (this.escenasAbiertas().has(idEscena)) {
      return;
    }
    const set = new Set(this.escenasAbiertas());
    set.add(idEscena);
    this.escenasAbiertas.set(set);
    this.guardarSetLocalStorage(ActosEscenasComponent.LS_ESCENAS_ABIERTAS, set);
  }

  private irAlNodoEnEdicion(): void {
    const idNodoStr = localStorage.getItem(ActosEscenasComponent.LS_NODO_EDITANDO);
    if (!idNodoStr) {
      return;
    }
    const idNodo = Number(idNodoStr);
    localStorage.removeItem(ActosEscenasComponent.LS_NODO_EDITANDO);

    for (const acto of this.actos()) {
      for (const escena of acto.escenas) {
        if (escena.nodos.some((n) => n.idNodo === idNodo)) {
          this.abrirActo(acto.idActo);
          this.abrirEscena(escena.idEscena);
        }
      }
    }

    setTimeout(() => {
      const el = document.getElementById(`nodo-${idNodo}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el?.classList.add('nodo-list__item--resaltado');
      setTimeout(() => el?.classList.remove('nodo-list__item--resaltado'), 2000);
    });
  }

  protected nuevoActo(): void {
    this.actoModal.set('nuevo');
  }

  protected editarActo(acto: ActoAutor): void {
    this.actoModal.set(acto);
  }

  protected cerrarActoModal(): void {
    this.actoModal.set(null);
  }

  protected onActoGuardado(): void {
    this.actoModal.set(null);
    this.cambiado.emit();
  }

  protected nuevaEscena(idActo: number): void {
    this.escenaModal.set({ idActo, escena: null });
  }

  protected editarEscena(idActo: number, escena: EscenaAutor): void {
    this.escenaModal.set({ idActo, escena });
  }

  protected cerrarEscenaModal(): void {
    this.escenaModal.set(null);
  }

  protected onEscenaGuardada(): void {
    this.escenaModal.set(null);
    this.cambiado.emit();
  }

  protected eliminarActo(acto: ActoAutor): void {
    const totalEscenas = acto.escenas.length;
    this.eliminarModal.set({
      titulo: `Eliminar acto "${acto.titulo}"`,
      mensaje:
        totalEscenas > 0
          ? `Este acto tiene ${totalEscenas} escena(s). Se eliminarán también todas sus escenas.`
          : `¿Seguro que quieres eliminar el acto "${acto.titulo}"?`,
      accion: () => this.autorService.eliminarActo(acto.idActo),
    });
  }

  protected eliminarEscena(escena: EscenaAutor): void {
    this.eliminarModal.set({
      titulo: `Eliminar escena "${escena.titulo}"`,
      mensaje: `¿Seguro que quieres eliminar la escena "${escena.titulo}"?`,
      accion: () => this.autorService.eliminarEscena(escena.idEscena),
    });
  }

  protected cerrarEliminarModal(): void {
    this.eliminarModal.set(null);
  }

  protected onEliminado(): void {
    this.eliminarModal.set(null);
    this.cambiado.emit();
  }

  protected moverActo(acto: ActoAutor, direccion: -1 | 1): void {
    const actos = this.actos();
    const index = actos.findIndex((a) => a.idActo === acto.idActo);
    const destino = index + direccion;
    if (destino < 0 || destino >= actos.length) {
      return;
    }

    const ids = actos.map((a) => a.idActo);
    [ids[index], ids[destino]] = [ids[destino], ids[index]];
    this.autorService.reordenarActos(this.idAventura(), ids).subscribe(() => this.cambiado.emit());
  }

  protected moverEscena(idActo: number, escenas: EscenaAutor[], escena: EscenaAutor, direccion: -1 | 1): void {
    const index = escenas.findIndex((e) => e.idEscena === escena.idEscena);
    const destino = index + direccion;
    if (destino < 0 || destino >= escenas.length) {
      return;
    }

    const ids = escenas.map((e) => e.idEscena);
    [ids[index], ids[destino]] = [ids[destino], ids[index]];
    this.autorService.reordenarEscenas(idActo, ids).subscribe(() => this.cambiado.emit());
  }

  protected nuevoNodo(idEscena: number): void {
    this.autorService.crearNodo(idEscena, { titulo: 'Nuevo nodo' }).subscribe((nodo) => this.irANodo(nodo.idNodo));
  }

  protected editarNodo(nodo: NodoAutorResumen): void {
    this.irANodo(nodo.idNodo);
  }

  private irANodo(idNodo: number): void {
    localStorage.setItem(ActosEscenasComponent.LS_NODO_EDITANDO, String(idNodo));
    void this.router.navigate(['/autor/aventura', this.idAventura(), 'nodo', idNodo]);
  }

  protected eliminarNodo(nodo: NodoAutorResumen): void {
    this.eliminarModal.set({
      titulo: `Eliminar nodo "${nodo.titulo}"`,
      mensaje: `¿Seguro que quieres eliminar el nodo "${nodo.titulo}"?`,
      accion: () => this.autorService.eliminarNodo(nodo.idNodo),
    });
  }
}
