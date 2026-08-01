import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ValoracionModalComponent } from '../../components/valoracion-modal/valoracion-modal.component';
import { PartidaService } from '../../data-access/partida.service';
import { Final } from '../../models/partida.model';

@Component({
  selector: 'app-final',
  imports: [ValoracionModalComponent],
  templateUrl: './final.component.html',
  styleUrl: './final.component.scss',
})
export class FinalComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly partidaService = inject(PartidaService);

  private readonly idFinal = Number(this.route.snapshot.paramMap.get('idFinal'));

  protected readonly final = signal<Final | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  protected readonly finalizando = signal(false);
  protected readonly idAventuraFinalizada = signal<number | null>(null);

  constructor() {
    this.partidaService
      .getFinal(this.idFinal)
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (final) => {
          this.final.set(final);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }

  protected finalizarAventura(): void {
    if (this.finalizando()) {
      return;
    }

    this.finalizando.set(true);

    this.partidaService.finalizarAventura(this.idFinal).subscribe({
      next: (respuesta) => {
        this.finalizando.set(false);
        this.idAventuraFinalizada.set(respuesta.idAventura);
      },
      error: () => {
        this.finalizando.set(false);
      },
    });
  }

  protected onValoracionCerrada(): void {
    void this.router.navigate(['/']);
  }
}
