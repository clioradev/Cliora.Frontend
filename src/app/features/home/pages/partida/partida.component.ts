import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { FichaPersonajeModalComponent } from '../../components/ficha-personaje-modal/ficha-personaje-modal.component';
import { ResultadoTiradaModalComponent } from '../../components/resultado-tirada-modal/resultado-tirada-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { Nodo, Opcion, TiradaResultado } from '../../models/partida.model';

@Component({
  selector: 'app-partida',
  imports: [ResultadoTiradaModalComponent, FichaPersonajeModalComponent],
  templateUrl: './partida.component.html',
  styleUrl: './partida.component.scss',
})
export class PartidaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly nodo = signal<Nodo | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly eligiendo = signal(false);
  protected readonly eligiendoError = signal<string | null>(null);

  protected readonly idAventura = signal<number | null>(null);

  protected readonly resultadoTirada = signal<TiradaResultado | null>(null);
  private destinoPendiente: { idNodo: number | null; idFinal: number | null } | null = null;

  protected readonly personajeAbierto = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const idAventuraParam = this.route.snapshot.queryParamMap.get('idAventura');
      this.idAventura.set(idAventuraParam ? Number(idAventuraParam) : null);
      this.cargarNodo(Number(params.get('idNodo')));
    });
  }

  protected elegir(opcion: Opcion): void {
    if (this.eligiendo()) {
      return;
    }

    this.eligiendo.set(true);
    this.eligiendoError.set(null);

    this.partidaService.elegirOpcion(opcion.idOpcion).subscribe({
      next: (respuesta) => {
        this.eligiendo.set(false);

        if (respuesta.tirada) {
          this.destinoPendiente = { idNodo: respuesta.idNodo, idFinal: respuesta.idFinal };
          this.resultadoTirada.set(respuesta.tirada);
          return;
        }

        this.navegarA(respuesta.idNodo, respuesta.idFinal);
      },
      error: () => {
        this.eligiendo.set(false);
        this.eligiendoError.set('No se ha podido procesar la elección.');
      },
    });
  }

  protected abrirPersonaje(): void {
    this.personajeAbierto.set(true);
  }

  protected continuarTrasTirada(): void {
    this.resultadoTirada.set(null);

    const destino = this.destinoPendiente;
    this.destinoPendiente = null;
    if (destino) {
      this.navegarA(destino.idNodo, destino.idFinal);
    }
  }

  private navegarA(idNodo: number | null, idFinal: number | null): void {
    const idAventura = this.idAventura();
    const queryParams = idAventura !== null ? { idAventura } : undefined;

    if (idFinal !== null) {
      void this.router.navigate(['/final', idFinal], { queryParams });
    } else if (idNodo !== null) {
      void this.router.navigate(['/partida', idNodo], { queryParams });
    }
  }

  private cargarNodo(idNodo: number): void {
    this.loading.set(true);
    this.error.set(false);
    this.nodo.set(null);

    this.partidaService
      .getNodo(idNodo)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (nodo) => {
          this.nodo.set(nodo);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
