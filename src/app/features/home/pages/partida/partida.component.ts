import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { ValoracionService } from '../../data-access/valoracion.service';
import { Nodo, Opcion } from '../../models/partida.model';

@Component({
  selector: 'app-partida',
  imports: [ValoracionModalComponent],
  templateUrl: './partida.component.html',
  styleUrl: './partida.component.scss',
})
export class PartidaComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);
  private readonly valoracionService = inject(ValoracionService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly nodo = signal<Nodo | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly eligiendo = signal(false);
  protected readonly eligiendoError = signal<string | null>(null);

  protected readonly idAventura = signal<number | null>(null);
  protected readonly puedeValorar = signal(false);
  protected readonly bannerCerrado = signal(false);
  protected readonly valorarAbierto = signal(false);

  constructor() {
    this.route.paramMap.pipe(takeUntilDestroyed()).subscribe((params) => {
      const idAventuraParam = this.route.snapshot.queryParamMap.get('idAventura');
      this.idAventura.set(idAventuraParam ? Number(idAventuraParam) : null);
      this.bannerCerrado.set(false);
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
        const idAventura = this.idAventura();
        const queryParams = idAventura !== null ? { idAventura } : undefined;

        if (respuesta.idFinal !== null) {
          void this.router.navigate(['/final', respuesta.idFinal], { queryParams });
        } else if (respuesta.idNodo !== null) {
          void this.router.navigate(['/partida', respuesta.idNodo], { queryParams });
        }
      },
      error: () => {
        this.eligiendo.set(false);
        this.eligiendoError.set('No se ha podido procesar la elección.');
      },
    });
  }

  protected abrirValorar(): void {
    this.valorarAbierto.set(true);
  }

  protected onValoracionCerrada(): void {
    this.valorarAbierto.set(false);
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

    this.comprobarElegibilidad();
  }

  private comprobarElegibilidad(): void {
    const idAventura = this.idAventura();
    if (idAventura === null) {
      return;
    }

    this.valoracionService
      .getMiValoracion(idAventura)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (mia) => this.puedeValorar.set(mia.puedeValorar),
        error: () => this.puedeValorar.set(false),
      });
  }
}
