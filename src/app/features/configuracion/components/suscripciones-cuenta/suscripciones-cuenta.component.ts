import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { PrecioPipe } from '../../../../shared/pipes/precio.pipe';
import { SuscripcionService } from '../../../tienda/data-access/suscripcion.service';
import { NOMBRE_PLAN, PlanSuscripcion, Suscripcion } from '../../../tienda/models/suscripcion.model';

/** Sección «Suscripciones» de Mi cuenta: solo aparece si el usuario tiene hijos. Pago simulado. */
@Component({
  selector: 'app-suscripciones-cuenta',
  imports: [DatePipe, PrecioPipe],
  templateUrl: './suscripciones-cuenta.component.html',
  styleUrl: './suscripciones-cuenta.component.scss',
})
export class SuscripcionesCuentaComponent {
  private readonly suscripcionService = inject(SuscripcionService);

  private readonly estadoResource = rxResource({ stream: () => this.suscripcionService.obtenerEstado() });
  protected readonly estado = this.estadoResource.value;
  protected readonly tieneHijos = computed(() => (this.estado()?.tramosHijos.length ?? 0) > 0);
  protected readonly nombrePlan = NOMBRE_PLAN;

  /** Plan que se va a contratar, a la espera de confirmar. */
  protected readonly confirmando = signal<{ plan: PlanSuscripcion; precioMensual: number } | null>(null);
  protected readonly mensaje = signal<string | null>(null);

  private readonly suscribirAction = asyncAction((plan: PlanSuscripcion) => this.suscripcionService.suscribir(plan), {
    onSuccess: (_r, plan) => this.terminar(`Suscripción ${NOMBRE_PLAN[plan].toLowerCase()} activada.`),
    defaultErrorMessage: 'No se ha podido activar la suscripción.',
  });
  private readonly cancelarAction = asyncAction(
    (suscripcion: Suscripcion) => this.suscripcionService.cancelarRenovacion(suscripcion.idSuscripcion),
    {
      onSuccess: () => this.terminar('Renovación cancelada. Seguirá activa hasta el final del mes pagado.'),
      defaultErrorMessage: 'No se ha podido cancelar.',
    },
  );
  protected readonly ocupado = computed(() => this.suscribirAction.loading() || this.cancelarAction.loading());
  protected readonly error = computed(() => this.suscribirAction.error() ?? this.cancelarAction.error());

  /** Recarga el estado (p. ej. tras añadir o dar de baja un hijo). */
  recargar(): void {
    this.estadoResource.reload();
  }

  /** Ya lo cubre una suscripción de pago activa. */
  protected cubierto(plan: PlanSuscripcion): boolean {
    return (this.estado()?.activas ?? []).some((s) => !s.esPrueba && (s.plan === 'Ambas' || s.plan === plan));
  }

  protected pruebaUsada(plan: PlanSuscripcion): boolean {
    return this.estado()?.pruebasUsadas.includes(plan) ?? false;
  }

  /** Día en que deja de dar acceso: la fecha de fin es exclusiva (medianoche del día siguiente). */
  protected ultimoDia(suscripcion: Suscripcion): Date {
    return new Date(new Date(suscripcion.fechaFin).getTime() - 1);
  }

  protected elegir(plan: { plan: PlanSuscripcion; precioMensual: number }): void {
    this.suscribirAction.reset();
    this.cancelarAction.reset();
    this.mensaje.set(null);
    this.confirmando.set(plan);
  }

  protected confirmar(): void {
    const plan = this.confirmando();
    if (plan) {
      this.suscribirAction.run(plan.plan);
    }
  }

  protected cancelarRenovacion(suscripcion: Suscripcion): void {
    this.mensaje.set(null);
    this.cancelarAction.run(suscripcion);
  }

  private terminar(mensaje: string): void {
    this.confirmando.set(null);
    this.mensaje.set(mensaje);
    this.estadoResource.reload();
  }
}
