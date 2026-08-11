import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { Usuario } from '../../../../core/auth/usuario.model';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AdminService } from '../../data-access/admin.service';
import { Rol } from '../../models/admin.model';

const ROL_ADMINISTRADOR = 'Administrador';

@Component({
  selector: 'app-editar-roles-modal',
  imports: [ModalComponent],
  templateUrl: './editar-roles-modal.component.html',
  styleUrl: './editar-roles-modal.component.scss',
})
export class EditarRolesModalComponent {
  private readonly adminService = inject(AdminService);
  private readonly authService = inject(AuthService);

  readonly usuario = input.required<Usuario>();
  readonly cerrado = output<void>();
  readonly guardado = output<Usuario>();

  private readonly _usuarioActual = signal<Usuario | null>(null);
  protected readonly usuarioActual = computed(() => this._usuarioActual() ?? this.usuario());

  constructor() {
    effect(() => this._usuarioActual.set(this.usuario()));
  }

  private readonly rolesResource = rxResource({
    stream: () => this.adminService.obtenerRoles(),
    defaultValue: [] as Rol[],
  });
  protected readonly roles = this.rolesResource.value;

  protected tieneRol(rol: Rol): boolean {
    return this.usuarioActual().roles.includes(rol.nombre);
  }

  protected esPropioRolAdministrador(rol: Rol): boolean {
    return rol.nombre === ROL_ADMINISTRADOR && this.usuarioActual().idUsuario === this.authService.currentUser()?.idUsuario;
  }

  private readonly toggleAction = asyncAction(
    (rol: Rol, activar: boolean) =>
      activar
        ? this.adminService.anadirRol(this.usuarioActual().idUsuario, rol.idRol)
        : this.adminService.quitarRol(this.usuarioActual().idUsuario, rol.idRol),
    {
      onSuccess: (usuarioActualizado) => {
        this._usuarioActual.set(usuarioActualizado);
        this.guardado.emit(usuarioActualizado);
      },
      defaultErrorMessage: 'No se ha podido actualizar el rol.',
    },
  );
  protected readonly guardando = this.toggleAction.loading;
  protected readonly error = this.toggleAction.error;

  protected toggleRol(rol: Rol, evento: Event): void {
    const activar = (evento.target as HTMLInputElement).checked;
    this.toggleAction.run(rol, activar);
  }
}
