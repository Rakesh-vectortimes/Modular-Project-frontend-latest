import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-rating-shape',
  standalone: true,
  template: `
    <div class="rating">
      @for (i of stars(); track i) {
        <span class="star" [style.color]="i <= value() ? color() : '#e5e7eb'">★</span>
      }
    </div>
  `,
  styles: `
    .rating {
      display: flex;
      gap: 0.125rem;
    }
    .star {
      font-size: 1.25rem;
      line-height: 1;
    }
  `,
})
export class RatingShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected value(): number {
    return numberProp(this.node().props, 'value', 3);
  }

  protected max(): number {
    return numberProp(this.node().props, 'max', 5);
  }

  protected stars(): number[] {
    return Array.from({ length: Math.max(0, this.max()) }, (_, i) => i + 1);
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#f59e0b');
  }
}
