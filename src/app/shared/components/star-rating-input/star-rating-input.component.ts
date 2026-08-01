import { Component, input, output } from '@angular/core';
import { StarRatingDisplayComponent } from '../star-rating-display/star-rating-display.component';

@Component({
  selector: 'app-star-rating-input',
  imports: [StarRatingDisplayComponent],
  templateUrl: './star-rating-input.component.html',
  styleUrl: './star-rating-input.component.scss',
})
export class StarRatingInputComponent {
  readonly value = input<number>(0);
  readonly valueChange = output<number>();

  protected readonly estrellas = [1, 2, 3, 4, 5];

  protected setValue(valor: number): void {
    this.valueChange.emit(valor);
  }
}
