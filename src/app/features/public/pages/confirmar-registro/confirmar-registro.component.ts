import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../../../core/auth/auth.service';
import { asyncAction } from '../../../../core/utils/async-action';
import { PreferenciasAplicadasService } from '../../../configuracion/data-access/preferencias-aplicadas.service';
import { PreferenciasService } from '../../../configuracion/data-access/preferencias.service';

@Component({
  selector: 'app-confirmar-registro',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './confirmar-registro.component.html',
  styleUrl: './confirmar-registro.component.scss',
})
export class ConfirmarRegistroComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly preferenciasService = inject(PreferenciasService);
  private readonly preferenciasAplicadas = inject(PreferenciasAplicadasService);

  private readonly queryParamMap = toSignal(this.route.queryParamMap, { requireSync: true });
  protected readonly email = computed(() => this.queryParamMap().get('email'));

  protected readonly form = this.fb.nonNullable.group({
    codigo: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  private readonly confirmarAction = asyncAction(
    (email: string, codigo: string) =>
      this.authService.confirmarRegistro(email, codigo).pipe(
        switchMap(() =>
          this.preferenciasService.obtenerPreferencias().pipe(
            tap((preferencias) => this.preferenciasAplicadas.aplicar(preferencias)),
            catchError(() => of(null)),
          ),
        ),
      ),
    {
      onSuccess: () => void this.router.navigate(['/']),
      defaultErrorMessage: 'El código no es válido o ha caducado.',
    },
  );
  protected readonly confirmando = this.confirmarAction.loading;
  protected readonly error = this.confirmarAction.error;

  protected onSubmit(): void {
    const email = this.email();
    if (this.form.invalid || !email) {
      return;
    }

    const { codigo } = this.form.getRawValue();
    this.confirmarAction.run(email, codigo);
  }

  private readonly reenviarAction = asyncAction((email: string) => this.authService.reenviarCodigoRegistro(email), {
    defaultErrorMessage: 'No se ha podido reenviar el código.',
  });
  protected readonly reenviando = this.reenviarAction.loading;
  protected readonly errorReenvio = this.reenviarAction.error;
  protected readonly reenviado = this.reenviarAction.success;

  protected reenviarCodigo(): void {
    const email = this.email();
    if (!email) {
      return;
    }

    this.reenviarAction.run(email);
  }
}
