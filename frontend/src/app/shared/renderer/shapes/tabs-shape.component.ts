import { Component, input, signal } from '@angular/core';

import { listProp, RenderNode, stringProp } from '../render-node.model';

/**
 * Simplified tab bar: renders selectable tab headers. Partitioning a
 * container's children by tab would need a per-child "which tab" assignment
 * that the builder tree doesn't support yet — flagged as a follow-up. For now
 * this is a visual tab bar you can place above your page content.
 */
@Component({
  selector: 'app-tabs-shape',
  standalone: true,
  template: `
    <div class="tabs">
      @for (tab of tabs(); track tab; let i = $index) {
        <button
          type="button"
          class="tab"
          [class.active]="active() === i"
          [disabled]="!interactive()"
          (click)="active.set(i)"
        >
          {{ tab }}
        </button>
      }
    </div>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 0.25rem;
      border-bottom: 1px solid #e5e7eb;
    }
    .tab {
      padding: 0.5rem 0.875rem;
      border: none;
      background: none;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #6b7280;
      cursor: pointer;
      border-bottom: 2px solid transparent;
    }
    .tab.active {
      color: #17a2b8;
      border-bottom-color: #17a2b8;
    }
  `,
})
export class TabsShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected readonly active = signal(0);

  protected tabs(): string[] {
    const items = listProp(this.node().props, 'tabs');
    return items.length ? items : [stringProp(this.node().props, 'label', 'Tab 1')];
  }
}
