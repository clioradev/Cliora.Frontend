import { Component, inject, signal } from '@angular/core';
import { rxResource, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged, of } from 'rxjs';
import { AdminService } from '../../data-access/admin.service';
import { UsuarioAdmin } from '../../models/admin.model';
import { AventurasGratisModalComponent } from '../aventuras-gratis-modal/aventuras-gratis-modal.component';
import { EditarRolesModalComponent } from '../editar-roles-modal/editar-roles-modal.component';

const LONGITUD_MINIMA_BUSQUEDA = 2;

@Component({
  selector: 'app-usuarios',
  imports: [AventurasGratisModalComponent, EditarRolesModalComponent],
  templateUrl: './usuarios.component.html',
  styleUrl: './usuarios.component.scss',
})
export class UsuariosComponent {
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
    defaultValue: [] as UsuarioAdmin[],
  });
  protected readonly usuarios = this.usuariosResource.value;
  protected readonly loading = this.usuariosResource.isLoading;
  protected readonly busquedaDemasiadoCorta = () =>
    this.query().trim().length > 0 && this.query().trim().length < LONGITUD_MINIMA_BUSQUEDA;

  protected readonly rolesModal = signal<UsuarioAdmin | null>(null);
  protected readonly aventurasGratisModal = signal<UsuarioAdmin | null>(null);

  protected onQueryInput(evento: Event): void {
    this.query.set((evento.target as HTMLInputElement).value);
  }

  protected editarRoles(usuario: UsuarioAdmin): void {
    this.rolesModal.set(usuario);
  }

  protected cerrarRolesModal(): void {
    this.rolesModal.set(null);
  }

  protected editarAventurasGratis(usuario: UsuarioAdmin): void {
    this.aventurasGratisModal.set(usuario);
  }

  protected cerrarAventurasGratisModal(): void {
    this.aventurasGratisModal.set(null);
  }

  protected onUsuarioActualizado(): void {
    this.usuariosResource.reload();
  }
}
