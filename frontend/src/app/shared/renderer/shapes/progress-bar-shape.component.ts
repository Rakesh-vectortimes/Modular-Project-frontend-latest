import { Component, input } from '@angular/core';

import { booleanProp, numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-progress-bar-shape',
  standalone: true,
  template: `
    <div class="progress-shape">
      <div class="track">
        <div class="fill" [style.width.%]="clampedValue()" [style.background]="color()"></div>
      </div>
      @if (showLabel()) {
        <span class="value-label">{{ clampedValue() }}%</span>
      }
    </div>
  `,
  styles: `
    .progress-shape {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }
    .track {
      flex: 1;
      height: 0.5rem;
      border-radius: 999px;
      background: #e5e7eb;
      overflow: hidden;
    }
    .fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.2s ease;
    }
    .value-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #4b5563;
      min-width: 2.25rem;
      text-align: right;
    }
  `,
})
export class ProgressBarShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected clampedValue(): number {
    const value = numberProp(this.node().props, 'value', 60);
    return Math.max(0, Math.min(100, value));
  }

  protected showLabel(): boolean {
    return booleanProp(this.node().props, 'showLabel');
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#17a2b8');
  }
}
