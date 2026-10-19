import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { DATOS_LEGALES } from '../../legal.config';

export type SeccionLegal = 'aviso' | 'privacidad' | 'cookies' | 'condiciones';

export const SECCIONES_LEGALES: { valor: SeccionLegal; etiqueta: string }[] = [
  { valor: 'aviso', etiqueta: 'Aviso legal' },
  { valor: 'privacidad', etiqueta: 'Privacidad' },
  { valor: 'cookies', etiqueta: 'Cookies' },
  { valor: 'condiciones', etiqueta: 'Condiciones' },
];

/**
 * Textos legales: aviso legal, privacidad, cookies y condiciones de uso y contratación, cada uno
 * en una pestaña con su propia URL (/legal/privacidad…) para poder enlazarlos. Abierta a todos,
 * con o sin sesión. Los datos del titular salen de legal.config.ts.
 */
@Component({
  selector: 'app-legal',
  imports: [RouterLink],
  templateUrl: './legal.component.html',
  styleUrl: './legal.component.scss',
})
export class LegalComponent {
  private readonly route = inject(ActivatedRoute);

  protected readonly datos = DATOS_LEGALES;
  protected readonly secciones = SECCIONES_LEGALES;
  private readonly parametro = toSignal(this.route.paramMap.pipe(map((p) => p.get('seccion'))));
  protected readonly seccion = computed<SeccionLegal>(() => {
    const valor = this.parametro();
    return SECCIONES_LEGALES.some((s) => s.valor === valor) ? (valor as SeccionLegal) : 'aviso';
  });
}
