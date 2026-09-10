import { Component, input } from '@angular/core';

import { listProp, RenderNode } from '../render-node.model';

@Component({
  selector: 'app-breadcrumb-shape',
  standalone: true,
  template: `
    <nav class="breadcrumb">
      @for (item of items(); track $index; let last = $last) {
        <span class="crumb" [class.current]="last">{{ item }}</span>
        @if (!last) {
          <span class="sep">›</span>
        }
      }
    </nav>
  `,
  styles: `
    .breadcrumb {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 0.375rem;
      font-size: 0.8125rem;
    }
    .crumb {
      color: #6b7280;
    }
    .crumb.current {
      color: #111827;
      font-weight: 600;
    }
    .sep {
      color: #9ca3af;
    }
  `,
})
export class BreadcrumbShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected items(): string[] {
    const items = listProp(this.node().props, 'items');
    return items.length ? items : ['Home'];
  }
}
