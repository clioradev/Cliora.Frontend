import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

/** Despedida tras darse de baja: ya sin sesión, dentro del portal público. */
@Component({
  selector: 'app-hasta-pronto',
  imports: [RouterLink],
  templateUrl: './hasta-pronto.component.html',
  styleUrl: './hasta-pronto.component.scss',
})
export class HastaProntoComponent {}
