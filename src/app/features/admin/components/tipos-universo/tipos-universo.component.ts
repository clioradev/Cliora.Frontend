import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { asyncAction } from '../../../../core/utils/async-action';
import { ConfirmarEliminarModalComponent } from '../../../../shared/components/confirmar-eliminar-modal/confirmar-eliminar-modal.component';
import { IconoComponent } from '../../../../shared/components/icono/icono.component';
import { AdminService } from '../../data-access/admin.service';
import { CatTipoUniversoAdmin } from '../../models/admin.model';

interface EliminarModalState {
  titulo: string;
  mensaje: string;
  accion: () => Observable<void>;
}

@Component({
  selector: 'app-tipos-universo',
  imports: [AreaTextoComponent, ReactiveFormsModule, IconoComponent, ConfirmarEliminarModalComponent],
  templateUrl: './tipos-universo.component.html',
  styleUrl: './tipos-universo.component.scss',
})
export class TiposUniversoComponent {
  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);

  private readonly tiposResource = rxResource({
    stream: () => this.adminService.obtenerTiposUniverso(),
    defaultValue: [] as CatTipoUniversoAdmin[],
  });
  protected readonly tipos = this.tiposResource.value;
  protected readonly cargando = this.tiposResource.isLoading;

  protected readonly form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.maxLength(50)]],
    descripcion: [''],
  });

  /** Tipo que se está editando en el formulario de arriba; null cuando el formulario crea uno nuevo. */
  protected readonly enEdicion = signal<CatTipoUniversoAdmin | null>(null);

  private readonly guardarAction = asyncAction(
    (nombre: string, descripcion: string | null) => {
      const tipo = this.enEdicion();
      return tipo
        ? this.adminService.actualizarTipoUniverso(tipo.id, { nombre, descripcion })
        : this.adminService.crearTipoUniverso({ nombre, descripcion });
    },
    {
      onSuccess: () => {
        this.cancelarEdicion();
        this.tiposResource.reload();
      },
      defaultErrorMessage: 'No se ha podido guardar el tipo de universo.',
    },
  );
  protected readonly guardando = this.guardarAction.loading;
  protected readonly errorGuardar = this.guardarAction.error;

  protected guardar(): void {
    if (this.form.invalid) {
      return;
    }

    const { nombre, descripcion } = this.form.getRawValue();
    this.guardarAction.run(nombre.trim(), descripcion.trim() || null);
  }

  protected editar(tipo: CatTipoUniversoAdmin): void {
    this.enEdicion.set(tipo);
    this.form.setValue({ nombre: tipo.nombre, descripcion: tipo.descripcion ?? '' });
  }

  protected cancelarEdicion(): void {
    this.enEdicion.set(null);
    this.form.reset();
  }

  protected readonly eliminarModal = signal<EliminarModalState | null>(null);

  protected eliminar(tipo: CatTipoUniversoAdmin): void {
    const uso =
      tipo.numeroUniversos === 0
        ? 'Ningún universo lo usa.'
        : `Lo usa${tipo.numeroUniversos === 1 ? ' 1 universo' : `n ${tipo.numeroUniversos} universos`}, que lo perderán.`;
    this.eliminarModal.set({
      titulo: `Eliminar tipo de universo "${tipo.nombre}"`,
      mensaje: `¿Seguro que quieres eliminar el tipo "${tipo.nombre}"? ${uso}`,
      accion: () => this.adminService.eliminarTipoUniverso(tipo.id),
    });
  }

  protected onEliminado(): void {
    this.eliminarModal.set(null);
    this.cancelarEdicion();
    this.tiposResource.reload();
  }
}
