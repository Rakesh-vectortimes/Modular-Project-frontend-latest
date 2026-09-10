import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

/**
 * A flex-row/column layout container. Like `section`, its children are rendered
 * by `CanvasNodeComponent` as a sibling drop-zone rather than true content
 * projection (an existing limitation shared with `section`/`kanban_board` — see
 * design notes), but the header/box below still gives useful visual grouping
 * and the `gap`/`align`/`justify` props apply to the drop-zone itself.
 */
@Component({
  selector: 'app-row-shape',
  standalone: true,
  template: `
    <div class="row-shape">
      <span class="row-label">{{ label() }}</span>
    </div>
  `,
  styles: `
    .row-shape {
      width: 100%;
      min-height: 1.5rem;
    }
    .row-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }
  `,
})
export class RowShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Row');
  }

  protected gap(): number {
    return numberProp(this.node().props, 'gap', 8);
  }
}
