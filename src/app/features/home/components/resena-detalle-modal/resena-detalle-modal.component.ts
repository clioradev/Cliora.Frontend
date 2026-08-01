import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { StarRatingDisplayComponent } from '../../../../shared/components/star-rating-display/star-rating-display.component';
import { UltimaValoracion } from '../../models/valoracion.model';

@Component({
  selector: 'app-resena-detalle-modal',
  imports: [ModalComponent, StarRatingDisplayComponent, DatePipe],
  templateUrl: './resena-detalle-modal.component.html',
  styleUrl: './resena-detalle-modal.component.scss',
})
export class ResenaDetalleModalComponent {
  readonly valoracion = input.required<UltimaValoracion>();
  readonly cerrado = output<void>();
}
