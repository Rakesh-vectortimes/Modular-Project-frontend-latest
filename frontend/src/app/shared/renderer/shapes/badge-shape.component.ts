import { Component, input } from '@angular/core';

import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-badge-shape',
  standalone: true,
  template: `<span class="badge" [class]="'tone-' + tone()">{{ text() }}</span>`,
  styles: `
    .badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .tone-neutral {
      background: #f1f5f9;
      color: #475569;
    }
    .tone-success {
      background: #dcfce7;
      color: #166534;
    }
    .tone-warning {
      background: #fef3c7;
      color: #92400e;
    }
    .tone-danger {
      background: #fee2e2;
      color: #991b1b;
    }
    .tone-info {
      background: #dbeafe;
      color: #1e40af;
    }
  `,
})
export class BadgeShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected text(): string {
    return stringProp(this.node().props, 'text', 'Badge');
  }

  protected tone(): string {
    const value = stringProp(this.node().props, 'tone', 'neutral');
    const allowed = ['neutral', 'success', 'warning', 'danger', 'info'];
    return allowed.includes(value) ? value : 'neutral';
  }
}
