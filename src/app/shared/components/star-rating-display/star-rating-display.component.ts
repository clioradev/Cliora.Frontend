import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-star-rating-display',
  templateUrl: './star-rating-display.component.html',
  styleUrl: './star-rating-display.component.scss',
})
export class StarRatingDisplayComponent {
  readonly value = input<number>(0);

  protected readonly fillPercent = computed(() => Math.max(0, Math.min(100, (this.value() / 5) * 100)));
}
