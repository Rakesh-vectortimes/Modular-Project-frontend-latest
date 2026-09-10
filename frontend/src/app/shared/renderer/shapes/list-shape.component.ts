import { Component, input } from '@angular/core';

import { listProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-list-shape',
  standalone: true,
  template: `
    <div class="list-shape">
      @if (label()) {
        <div class="list-title">{{ label() }}</div>
      }
      <ul [class]="'style-' + itemType()">
        @for (item of items(); track item) {
          <li>{{ item }}</li>
        } @empty {
          <li class="empty">No items yet</li>
        }
      </ul>
    </div>
  `,
  styles: `
    .list-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #374151;
      margin-bottom: 0.375rem;
    }
    ul {
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    ul.style-bullet {
      padding-left: 1.1rem;
      list-style: disc;
    }
    ul.style-numbered {
      padding-left: 1.1rem;
      list-style: decimal;
    }
    ul.style-plain {
      padding-left: 0;
      list-style: none;
    }
    li {
      font-size: 0.8125rem;
      color: #4b5563;
    }
    li.empty {
      list-style: none;
      color: #9ca3af;
      margin-left: -1.1rem;
    }
  `,
})
export class ListShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', '');
  }

  protected items(): string[] {
    return listProp(this.node().props, 'items');
  }

  protected itemType(): string {
    const value = stringProp(this.node().props, 'itemType', 'bullet');
    const allowed = ['bullet', 'numbered', 'plain'];
    return allowed.includes(value) ? value : 'bullet';
  }
}
