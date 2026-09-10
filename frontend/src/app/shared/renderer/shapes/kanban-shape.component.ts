import { Component, input } from '@angular/core';

import { RenderNode, stringProp } from '../render-node.model';

interface KanbanColumn {
  id?: string;
  title?: string;
}

@Component({
  selector: 'app-kanban-shape',
  standalone: true,
  template: `
    <div class="kanban">
      <div class="kanban-title">{{ label() }}</div>
      <div class="kanban-columns">
        @for (col of columns(); track col.id ?? col.title) {
          <div class="kanban-column">
            <div class="column-header">{{ col.title || 'Column' }}</div>
            <div class="column-body"></div>
          </div>
        }
      </div>
      <ng-content />
    </div>
  `,
  styles: `
    .kanban {
      width: 100%;
      min-height: 8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .kanban-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #374151;
    }
    .kanban-columns {
      display: flex;
      gap: 0.75rem;
      flex: 1;
    }
    .kanban-column {
      flex: 1;
      min-width: 5rem;
      background: #f3f4f6;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
    }
    .column-header {
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      border-bottom: 1px solid #e5e7eb;
    }
    .column-body {
      flex: 1;
      min-height: 4rem;
      padding: 0.5rem;
    }
  `,
})
export class KanbanShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Kanban Board');
  }

  protected columns(): KanbanColumn[] {
    const value = this.node().props['columns'];
    return Array.isArray(value) ? (value as KanbanColumn[]) : [];
  }
}
