import { Component, input } from '@angular/core';

import { booleanProp, numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-card-shape',
  standalone: true,
  template: `
    <div
      class="card-shape"
      [class.elevated]="elevated()"
      [style.padding.px]="padding()"
    >
      @if (title()) {
        <div class="card-title">{{ title() }}</div>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .card-shape {
      width: 100%;
      height: 100%;
      min-height: 4rem;
      box-sizing: border-box;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 10px;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .card-shape.elevated {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
    .card-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1f2937;
    }
  `,
})
export class CardShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected title(): string {
    return stringProp(this.node().props, 'title', '');
  }

  protected padding(): number {
    return numberProp(this.node().props, 'padding', 12);
  }

  protected elevated(): boolean {
    return this.node().props['elevated'] === undefined
      ? true
      : booleanProp(this.node().props, 'elevated');
  }
}
