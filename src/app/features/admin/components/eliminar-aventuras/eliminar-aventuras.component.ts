import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { AdminService } from '../../data-access/admin.service';
import { AventuraAdmin } from '../../models/admin.model';

const NOMBRE_ESTADO: Record<string, string> = {
  Borrador: 'Borrador',
  Publicada: 'Publicada',
  Oculta: 'Oculta',
  SolicitudPublicacion: 'Pendiente de revisión',
};

@Component({
  selector: 'app-eliminar-aventuras',
  imports: [ConfirmarEliminarModalComponent],
  templateUrl: './eliminar-aventuras.component.html',
  styleUrl: './eliminar-aventuras.component.scss',
})
export class EliminarAventurasComponent {
  private readonly adminService = inject(AdminService);

  private readonly aventurasResource = rxResource({
    stream: () => this.adminService.obtenerAventuras(),
    defaultValue: [] as AventuraAdmin[],
  });
  protected readonly cargando = this.aventurasResource.isLoading;

  protected readonly filtro = signal('');
  protected readonly aventuras = computed(() => {
    const texto = this.filtro().trim().toLowerCase();
    const todas = this.aventurasResource.value();
    if (!texto) {
      return todas;
    }
    return todas.filter((a) =>
      [a.tituloAventura, a.tituloCampana, a.tituloUniverso, a.emailAutor ?? ''].some((campo) =>
        campo.toLowerCase().includes(texto),
      ),
    );
  });

  protected readonly aventuraAEliminar = signal<AventuraAdmin | null>(null);

  protected onFiltroInput(evento: Event): void {
    this.filtro.set((evento.target as HTMLInputElement).value);
  }

  protected estados(aventura: AventuraAdmin): string {
    return aventura.estadosVersiones.map((e) => NOMBRE_ESTADO[e] ?? e).join(' · ');
  }

  protected mensajeConfirmacion(aventura: AventuraAdmin): string {
    return (
      `Se borrará «${aventura.tituloAventura}» por completo: todas sus versiones y su contenido, ` +
      `${aventura.cantidadPartidas} partida(s) jugada(s), ${aventura.cantidadValoraciones} valoración(es), ` +
      `sus imágenes y audios, y cualquier condición o efecto de otras aventuras de la campaña que dependa de ella.`
    );
  }

  protected readonly eliminar = (): Observable<void> =>
    this.adminService.eliminarAventura(this.aventuraAEliminar()!.idAventura);

  protected onEliminada(): void {
    this.aventuraAEliminar.set(null);
    this.aventurasResource.reload();
  }
}
