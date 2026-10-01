import { Component, computed, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { AreaTextoComponent } from '../../../../shared/components/area-texto/area-texto.component';
import { ContactoService } from '../../data-access/contacto.service';

const MAX_LENGTH_MENSAJE = 2000;

@Component({
  selector: 'app-escribir',
  imports: [AreaTextoComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './escribir.component.html',
  styleUrls: ['../../informacion-pagina.scss', './escribir.component.scss'],
})
export class EscribirComponent {
  private readonly contactoService = inject(ContactoService);
  private readonly authService = inject(AuthService);

  protected readonly maxLength = MAX_LENGTH_MENSAJE;
  protected readonly esAutor = computed(() => this.authService.tieneRol('Autor'));

  protected readonly mensaje = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(MAX_LENGTH_MENSAJE)],
  });
  private readonly valorMensaje = toSignal(this.mensaje.valueChanges, { initialValue: '' });
  protected readonly caracteres = computed(() => this.valorMensaje().length);
  protected readonly puedeEnviar = computed(
    () => this.valorMensaje().trim().length > 0 && this.valorMensaje().length <= MAX_LENGTH_MENSAJE,
  );

  private readonly enviarAction = asyncAction((mensaje: string) => this.contactoService.solicitarInformacionAutor(mensaje), {
    onSuccess: () => this.mensaje.reset(),
    defaultErrorMessage: 'No se ha podido enviar el mensaje. Inténtalo de nuevo más tarde.',
  });
  protected readonly enviando = this.enviarAction.loading;
  protected readonly error = this.enviarAction.error;
  protected readonly enviado = this.enviarAction.success;

  protected enviar(): void {
    if (this.puedeEnviar()) {
      this.enviarAction.run(this.mensaje.value.trim());
    }
  }

  protected escribirOtro(): void {
    this.enviarAction.reset();
  }
}
