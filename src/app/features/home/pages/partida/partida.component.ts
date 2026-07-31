import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { PartidaService } from '../../data-access/partida.service';
import { Nodo, Opcion } from '../../models/partida.model';

@Component({
  selector: 'app-partida',
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

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
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

        if (respuesta.idFinal !== null) {
          void this.router.navigate(['/final', respuesta.idFinal]);
        } else if (respuesta.idNodo !== null) {
          void this.router.navigate(['/partida', respuesta.idNodo]);
        }
      },
      error: () => {
        this.eligiendo.set(false);
        this.eligiendoError.set('No se ha podido procesar la elección.');
      },
    });
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
