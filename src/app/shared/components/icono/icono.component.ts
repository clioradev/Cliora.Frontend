import { Component, input } from '@angular/core';

export type NombreIcono =
  | 'editar'
  | 'eliminar'
  | 'añadir'
  | 'guardar'
  | 'volver'
  | 'calcular'
  | 'subir'
  | 'condicion';

const PATHS: Record<NombreIcono, string> = {
  editar:
    'M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a.996.996 0 000-1.41l-2.34-2.34a.996.996 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z',
  eliminar: 'M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z',
  añadir: 'M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z',
  guardar: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
  volver: 'M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z',
  calcular:
    'M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0 0 20 12c0-4.42-3.58-8-8-8zM5.3 7.2 3.84 5.74A7.93 7.93 0 0 0 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8z',
  subir: 'M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z',
  condicion:
    'M4.25 5.61C6.27 8.2 10 13 10 13v6c0 .55.45 1 1 1h2c.55 0 1-.45 1-1v-6s3.72-4.8 5.74-7.39c.51-.66.04-1.61-.79-1.61H5.04c-.83 0-1.3.95-.79 1.61z',
};

@Component({
  selector: 'app-icono',
  templateUrl: './icono.component.html',
  styleUrl: './icono.component.scss',
})
export class IconoComponent {
  readonly nombre = input.required<NombreIcono>();

  protected get path(): string {
    return PATHS[this.nombre()];
  }
}
