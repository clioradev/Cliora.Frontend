import { Component, computed, inject, input, output, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { asyncAction } from '../../../../core/utils/async-action';
import { NOMBRE_TRAMO } from '../../../../core/utils/tramo-edad';
import { HijoCamposComponent } from '../../../../shared/components/hijo-campos/hijo-campos.component';
import {
  crearHijoForm,
  datosDeHijoForm,
  HIJO_PASSWORD_LONGITUD_MINIMA,
  HijoForm,
  MAXIMO_HIJOS,
} from '../../../../shared/components/hijo-campos/hijo-form';
import { CuentaService } from '../../data-access/cuenta.service';
import { Hijo } from '../../models/cuenta.model';

type Edicion =
  | { tipo: 'nuevo'; form: HijoForm }
  | { tipo: 'editar'; hijo: Hijo; form: HijoForm }
  | { tipo: 'acceso'; hijo: Hijo }
  | { tipo: 'baja'; hijo: Hijo };

/** Sección «Tus hijos» de Mi cuenta: alta, edición, acceso propio y baja de los perfiles. */
@Component({
  selector: 'app-hijos-cuenta',
  imports: [HijoCamposComponent],
  templateUrl: './hijos-cuenta.component.html',
  styleUrl: './hijos-cuenta.component.scss',
})
export class HijosCuentaComponent {
  private readonly cuentaService = inject(CuentaService);

  /** Sin fecha de nacimiento del padre no se pueden añadir hijos. */
  readonly puedeAnadir = input(true);
  /** Se ha añadido, cambiado o dado de baja un hijo. */
  readonly cambiado = output<void>();

  private readonly hijosResource = rxResource({ stream: () => this.cuentaService.obtenerHijos() });
  protected readonly hijos = computed(() => this.hijosResource.value() ?? []);
  protected readonly cargando = this.hijosResource.isLoading;
  protected readonly errorCarga = computed(() => this.hijosResource.error() !== undefined);
  protected readonly caben = computed(() => this.hijos().length < MAXIMO_HIJOS);

  protected readonly nombreTramo = NOMBRE_TRAMO;
  protected readonly longitudMinima = HIJO_PASSWORD_LONGITUD_MINIMA;
  protected readonly maximoHijos = MAXIMO_HIJOS;

  protected readonly edicion = signal<Edicion | null>(null);
  protected readonly password = signal('');
  protected readonly mensaje = signal<string | null>(null);

  private readonly guardarAction = asyncAction(
    (edicion: Extract<Edicion, { form: HijoForm }>) => {
      const datos = datosDeHijoForm(edicion.form);
      return edicion.tipo === 'nuevo'
        ? this.cuentaService.crearHijo(datos)
        : this.cuentaService.actualizarHijo(edicion.hijo.idUsuario, datos);
    },
    {
      onSuccess: (_r, edicion) => this.terminar(edicion.tipo === 'nuevo' ? 'Perfil añadido.' : 'Cambios guardados.'),
      defaultErrorMessage: 'No se han podido guardar los cambios.',
    },
  );

  private readonly accesoAction = asyncAction(
    (hijo: Hijo, password: string) => this.cuentaService.cambiarAccesoHijo(hijo.idUsuario, password),
    {
      onSuccess: (_r, hijo, password) =>
        this.terminar(password ? `${hijo.nombre} ya puede entrar con tu email y su contraseña.` : 'Acceso propio quitado.'),
      defaultErrorMessage: 'No se ha podido cambiar el acceso.',
    },
  );

  private readonly bajaAction = asyncAction(
    (hijo: Hijo, password: string) => this.cuentaService.bajaHijo(hijo.idUsuario, password),
    {
      onSuccess: (_r, hijo) => this.terminar(`Se ha dado de baja el perfil de ${hijo.nombre}.`),
      defaultErrorMessage: 'No se ha podido dar de baja el perfil.',
    },
  );

  protected readonly ocupado = computed(
    () => this.guardarAction.loading() || this.accesoAction.loading() || this.bajaAction.loading(),
  );
  protected readonly error = computed(
    () => this.guardarAction.error() ?? this.accesoAction.error() ?? this.bajaAction.error(),
  );

  protected nuevo(): void {
    this.abrir({ tipo: 'nuevo', form: crearHijoForm() });
  }

  protected editar(hijo: Hijo): void {
    const form = crearHijoForm(
      {
        nombre: hijo.nombre,
        fechaNacimiento: hijo.fechaNacimiento ?? '',
        tipoUsuario: hijo.tipoUsuario,
        lecturaAutomatica: hijo.lecturaAutomatica,
      },
      hijo.tipoUsuario,
    );
    this.abrir({ tipo: 'editar', hijo, form });
  }

  protected acceso(hijo: Hijo): void {
    this.abrir({ tipo: 'acceso', hijo });
  }

  protected baja(hijo: Hijo): void {
    this.abrir({ tipo: 'baja', hijo });
  }

  protected cancelar(): void {
    this.edicion.set(null);
  }

  protected onPasswordInput(evento: Event): void {
    this.password.set((evento.target as HTMLInputElement).value);
  }

  protected guardar(): void {
    const edicion = this.edicion();
    if (edicion && 'form' in edicion) {
      if (edicion.form.invalid) {
        edicion.form.markAllAsTouched();
        return;
      }
      this.guardarAction.run(edicion);
    }
  }

  protected guardarAcceso(hijo: Hijo): void {
    if (this.password().length >= HIJO_PASSWORD_LONGITUD_MINIMA) {
      this.accesoAction.run(hijo, this.password());
    }
  }

  protected quitarAcceso(hijo: Hijo): void {
    this.accesoAction.run(hijo, '');
  }

  protected confirmarBaja(hijo: Hijo): void {
    if (this.password()) {
      this.bajaAction.run(hijo, this.password());
    }
  }

  private abrir(edicion: Edicion): void {
    this.guardarAction.reset();
    this.accesoAction.reset();
    this.bajaAction.reset();
    this.password.set('');
    this.mensaje.set(null);
    this.edicion.set(edicion);
  }

  private terminar(mensaje: string): void {
    this.edicion.set(null);
    this.mensaje.set(mensaje);
    this.hijosResource.reload();
    this.cambiado.emit();
  }
}
