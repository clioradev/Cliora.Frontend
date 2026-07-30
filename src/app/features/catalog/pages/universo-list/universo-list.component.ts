import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UniversoService } from '../../data-access/universo.service';
import { Universo } from '../../models/universo.model';

@Component({
  selector: 'app-universo-list',
  templateUrl: './universo-list.component.html',
  styleUrl: './universo-list.component.scss',
})
export class UniversoListComponent {
  private readonly universoService = inject(UniversoService);

  protected readonly universos = signal<Universo[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  constructor() {
    this.universoService
      .getUniversos()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (universos) => {
          this.universos.set(universos);
          this.loading.set(false);
        },
        error: () => {
          this.error.set(true);
          this.loading.set(false);
        },
      });
  }
}
