import { Component, computed, input } from '@angular/core';
import { ProgresoAventuraGratis } from './progreso-aventura-gratis.model';

/**
 * Las rayitas hacia la siguiente aventura gratis: tantas encendidas como valoraciones lleva. Con
 * `animar`, la última encendida (o todas, si acaba de ganar una) se ilumina con un destello.
 */
@Component({
  selector: 'app-progreso-aventura-gratis',
  templateUrl: './progreso-aventura-gratis.component.html',
  styleUrl: './progreso-aventura-gratis.component.scss',
})
export class ProgresoAventuraGratisComponent {
  readonly progreso = input.required<ProgresoAventuraGratis>();
  readonly animar = input(false);

  // Al ganar una, el progreso vuelve a 0: se enseñan todas encendidas para celebrarlo.
  protected readonly encendidas = computed(() =>
    this.progreso().ganadaAhora ? this.progreso().valoracionesNecesarias : this.progreso().valoracionesHechas,
  );

  protected readonly rayitas = computed(() =>
    Array.from({ length: this.progreso().valoracionesNecesarias }, (_, i) => ({
      encendida: i < this.encendidas(),
      destello: this.animar() && (this.progreso().ganadaAhora || i === this.encendidas() - 1),
    })),
  );

  protected readonly faltan = computed(() => this.progreso().valoracionesNecesarias - this.progreso().valoracionesHechas);
}
