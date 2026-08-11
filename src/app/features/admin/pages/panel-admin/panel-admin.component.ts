import { Component, inject, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { Usuario } from '../../../../core/auth/usuario.model';
import { EditarRolesModalComponent } from '../../components/editar-roles-modal/editar-roles-modal.component';
import { AdminService } from '../../data-access/admin.service';

const LONGITUD_MINIMA_BUSQUEDA = 2;

@Component({
  selector: 'app-panel-admin',
  imports: [EditarRolesModalComponent],
  templateUrl: './panel-admin.component.html',
  styleUrl: './panel-admin.component.scss',
})
export class PanelAdminComponent {
  private readonly adminService = inject(AdminService);

  protected readonly query = signal('');
  private readonly queryDebounced = toSignal(
    toObservable(this.query).pipe(debounceTime(300), distinctUntilChanged()),
    { initialValue: '' },
  );

  private readonly usuariosResource = rxResource({
    params: () => ({ email: this.queryDebounced().trim() }),
    stream: ({ params }) =>
      params.email.length >= LONGITUD_MINIMA_BUSQUEDA ? this.adminService.buscarUsuarios(params.email) : of([]),
    defaultValue: [] as Usuario[],
  });
  protected readonly usuarios = this.usuariosResource.value;
  protected readonly loading = this.usuariosResource.isLoading;
  protected readonly busquedaDemasiadoCorta = () =>
    this.query().trim().length > 0 && this.query().trim().length < LONGITUD_MINIMA_BUSQUEDA;

  protected readonly rolesModal = signal<Usuario | null>(null);

  protected onQueryInput(evento: Event): void {
    this.query.set((evento.target as HTMLInputElement).value);
  }

  protected editarRoles(usuario: Usuario): void {
    this.rolesModal.set(usuario);
  }

  protected cerrarRolesModal(): void {
    this.rolesModal.set(null);
  }

  protected onRolesActualizados(): void {
    this.usuariosResource.reload();
  }
}
