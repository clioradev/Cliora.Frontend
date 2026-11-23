import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { descargar, nombreArchivoDescarga } from '../../../../core/utils/descargar';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AdminService } from '../../data-access/admin.service';
import { AventuraTerminada, PerfilImpresion, UsuarioAdmin } from '../../models/admin.model';

/**
 * Imprime en PDF una aventura terminada por el usuario. Si tiene hijos, primero se elige el perfil
 * (el suyo o el de un hijo); luego, sus aventuras terminadas, cada una con su botón.
 */
@Component({
  selector: 'app-imprimir-modal',
  imports: [DatePipe, ModalComponent],
  templateUrl: './imprimir-modal.component.html',
  styleUrl: './imprimir-modal.component.scss',
})
export class ImprimirModalComponent {
  private readonly adminService = inject(AdminService);

  readonly usuario = input.required<UsuarioAdmin>();
  readonly cerrado = output<void>();

  private readonly perfilesResource = rxResource({
    params: () => this.usuario().idUsuario,
    stream: ({ params }) => this.adminService.obtenerPerfilesImpresion(params),
    defaultValue: [] as PerfilImpresion[],
  });
  protected readonly perfiles = this.perfilesResource.value;
  protected readonly cargando = this.perfilesResource.isLoading;
  protected readonly errorCarga = computed(() =>
    this.perfilesResource.error() ? 'No se han podido cargar las aventuras del usuario.' : null,
  );

  private readonly idPerfilElegido = signal<number | null>(null);
  /** Con un solo perfil (sin hijos) no hay nada que elegir. */
  protected readonly perfil = computed<PerfilImpresion | null>(() => {
    const perfiles = this.perfiles();
    if (perfiles.length === 1) {
      return perfiles[0];
    }
    return perfiles.find((p) => p.idUsuario === this.idPerfilElegido()) ?? null;
  });
  protected readonly variosPerfiles = computed(() => this.perfiles().length > 1);

  protected readonly imprimiendo = signal<number | null>(null);

  private readonly imprimirAction = asyncAction(
    (idUsuario: number, aventura: AventuraTerminada) => this.adminService.imprimirAventura(idUsuario, aventura.idAventura),
    {
      onSuccess: (respuesta, _idUsuario, aventura) => {
        this.imprimiendo.set(null);
        if (respuesta.body) {
          descargar(respuesta.body, nombreArchivoDescarga(respuesta.headers.get('Content-Disposition')) ?? `${aventura.titulo}.pdf`);
        }
      },
      onError: () => this.imprimiendo.set(null),
      defaultErrorMessage: 'No se ha podido generar el PDF.',
    },
  );
  protected readonly errorImprimir = this.imprimirAction.error;

  protected elegirPerfil(perfil: PerfilImpresion): void {
    this.imprimirAction.reset();
    this.idPerfilElegido.set(perfil.idUsuario);
  }

  protected volverAPerfiles(): void {
    this.imprimirAction.reset();
    this.idPerfilElegido.set(null);
  }

  protected imprimir(perfil: PerfilImpresion, aventura: AventuraTerminada): void {
    if (this.imprimiendo() !== null) {
      return;
    }
    this.imprimiendo.set(aventura.idAventura);
    this.imprimirAction.run(perfil.idUsuario, aventura);
  }
}
