import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { AdminService } from '../../data-access/admin.service';
import { MovimientoAventuraGratis, TIPOS_MOVIMIENTO_AVENTURA_GRATIS, UsuarioAdmin } from '../../models/admin.model';

const MAXIMO_AJUSTE = 100;

@Component({
  selector: 'app-aventuras-gratis-modal',
  imports: [DatePipe, ModalComponent],
  templateUrl: './aventuras-gratis-modal.component.html',
  styleUrl: './aventuras-gratis-modal.component.scss',
})
export class AventurasGratisModalComponent {
  private readonly adminService = inject(AdminService);

  readonly usuario = input.required<UsuarioAdmin>();
  readonly cerrado = output<void>();
  readonly guardado = output<UsuarioAdmin>();

  private readonly _usuarioActual = signal<UsuarioAdmin | null>(null);
  protected readonly usuarioActual = computed(() => this._usuarioActual() ?? this.usuario());

  protected readonly cantidad = signal(1);
  protected readonly motivo = signal('');

  constructor() {
    effect(() => this._usuarioActual.set(this.usuario()));
  }

  private readonly movimientosResource = rxResource({
    params: () => this.usuarioActual().idUsuario,
    stream: ({ params }) => this.adminService.obtenerMovimientosAventurasGratis(params),
    defaultValue: [] as MovimientoAventuraGratis[],
  });
  protected readonly movimientos = this.movimientosResource.value;
  protected readonly cargandoMovimientos = this.movimientosResource.isLoading;

  protected readonly saldoResultante = computed(() => this.usuarioActual().aventurasGratis + this.cantidad());
  protected readonly cantidadValida = computed(
    () =>
      Number.isInteger(this.cantidad()) &&
      this.cantidad() !== 0 &&
      Math.abs(this.cantidad()) <= MAXIMO_AJUSTE &&
      this.saldoResultante() >= 0,
  );

  private readonly ajustarAction = asyncAction(
    () =>
      this.adminService.ajustarAventurasGratis(this.usuarioActual().idUsuario, {
        cantidad: this.cantidad(),
        motivo: this.motivo().trim() || null,
      }),
    {
      canRun: () => this.cantidadValida(),
      onSuccess: (usuarioActualizado) => {
        this._usuarioActual.set(usuarioActualizado);
        this.cantidad.set(1);
        this.motivo.set('');
        this.movimientosResource.reload();
        this.guardado.emit(usuarioActualizado);
      },
      defaultErrorMessage: 'No se han podido actualizar las aventuras gratis.',
    },
  );
  protected readonly guardando = this.ajustarAction.loading;
  protected readonly error = this.ajustarAction.error;

  protected sumar(delta: number): void {
    this.cantidad.update((c) => c + delta);
  }

  protected onCantidadInput(evento: Event): void {
    this.cantidad.set(Number((evento.target as HTMLInputElement).value));
  }

  protected onMotivoInput(evento: Event): void {
    this.motivo.set((evento.target as HTMLInputElement).value);
  }

  protected guardar(): void {
    this.ajustarAction.run();
  }

  protected nombreTipo(movimiento: MovimientoAventuraGratis): string {
    return TIPOS_MOVIMIENTO_AVENTURA_GRATIS[movimiento.tipo];
  }
}
