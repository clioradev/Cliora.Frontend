import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-configuracion-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './configuracion-shell.component.html',
  styleUrl: './configuracion-shell.component.scss',
})
export class ConfiguracionShellComponent {}
