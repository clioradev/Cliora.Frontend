import { Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { TipoUsuario } from '../../../core/auth/usuario.model';
import { hoyIso, NOMBRE_TRAMO, tramoPropuesto, tramosPermitidos } from '../../../core/utils/tramo-edad';
import { HIJO_PASSWORD_LONGITUD_MINIMA, HijoForm } from './hijo-form';

/** Campos de un hijo: nombre, fecha, tramo, acceso propio y lectura en voz alta, con sus avisos. */
@Component({
  selector: 'app-hijo-campos',
  imports: [ReactiveFormsModule],
  templateUrl: './hijo-campos.component.html',
  styleUrl: './hijo-campos.component.scss',
})
export class HijoCamposComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly grupo = input.required<HijoForm>();
  /** Al editar un hijo, la contraseña se cambia aparte. */
  readonly conPassword = input(true);
  /** Tramo que ya tiene al editarlo: se ofrece aunque por edad ya le toque otro. */
  readonly tramoActual = input<TipoUsuario | null>(null);

  protected readonly hoy = hoyIso();
  protected readonly nombreTramo = NOMBRE_TRAMO;
  protected readonly longitudMinima = HIJO_PASSWORD_LONGITUD_MINIMA;

  private readonly valores = signal<ReturnType<HijoForm['getRawValue']> | null>(null);
  protected readonly propuesto = computed(() => tramoPropuesto(this.valores()?.fechaNacimiento));
  protected readonly tramos = computed(() => {
    const permitidos = tramosPermitidos(this.valores()?.fechaNacimiento);
    const actual = this.tramoActual();
    return actual && !permitidos.includes(actual) ? [actual, ...permitidos] : permitidos;
  });
  protected readonly tipo = computed(() => this.valores()?.tipoUsuario ?? null);

  ngOnInit(): void {
    const grupo = this.grupo();
    this.valores.set(grupo.getRawValue());
    grupo.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.valores.set(grupo.getRawValue()));

    // Al cambiar la fecha se propone el tramo que le toca, salvo que el elegido siga siendo válido.
    grupo.controls.fechaNacimiento.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((fecha) => {
      const permitidos = tramosPermitidos(fecha);
      const tipo = grupo.controls.tipoUsuario.value;
      if (permitidos.length > 0 && !permitidos.includes(tipo) && tipo !== this.tramoActual()) {
        grupo.controls.tipoUsuario.setValue(permitidos[0]);
      }
    });
  }
}
