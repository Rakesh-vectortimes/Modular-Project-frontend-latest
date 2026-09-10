import { DatePipe } from '@angular/common';
import { Component, OnChanges, inject, input } from '@angular/core';

import {
  PageDataFieldSpec,
  PageDataService,
} from '../../../core/services/page-data.service';
import { EntityService } from '../../../core/services/entity.service';
import { numberProp, RenderNode, stringProp } from '../render-node.model';

interface TableRowVM {
  id: string;
  values: Record<string, unknown>;
  submitted_at: string;
}

/**
 * Shows the records captured in a reusable entity (table), or the submissions
 * of a specific page. Bind it to an entity to list a table's rows regardless of
 * which page created them (e.g. a List page showing Customers).
 */
@Component({
  selector: 'app-data-table-shape',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="data-table">
      @if (!hasSource()) {
        <p class="empty">Choose a source entity (table) or page in Properties.</p>
      } @else if (loading) {
        <p class="empty">Loading…</p>
      } @else if (!fields.length) {
        <p class="empty">This table has no fields yet.</p>
      } @else {
        <table>
          <thead>
            <tr>
              @for (field of fields; track field.key) {
                <th>{{ field.label }}</th>
              }
              <th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            @for (row of rows; track row.id) {
              <tr>
                @for (field of fields; track field.key) {
                  <td>{{ row.values[field.key] }}</td>
                }
                <td>{{ row.submitted_at | date: 'short' }}</td>
              </tr>
            } @empty {
              <tr><td [attr.colspan]="fields.length + 1" class="empty">No submissions yet.</td></tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
  styles: `
    .data-table {
      width: 100%;
      overflow: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.8125rem;
    }
    th, td {
      text-align: left;
      padding: 0.5rem 0.625rem;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      font-weight: 600;
      color: #374151;
      background: #f9fafb;
    }
    .empty {
      padding: 0.75rem;
      color: #9ca3af;
      font-size: 0.8125rem;
    }
  `,
})
export class DataTableShapeComponent implements OnChanges {
  private readonly pageData = inject(PageDataService);
  private readonly entityService = inject(EntityService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected fields: PageDataFieldSpec[] = [];
  protected rows: TableRowVM[] = [];
  protected loading = false;

  ngOnChanges(): void {
    if (this.useEntitySource()) {
      this.loadFromEntity(this.sourceEntityId());
    } else {
      this.loadFromPage(this.sourcePageId());
    }
  }

  private loadFromEntity(entityId: string): void {
    if (!entityId) {
      this.fields = [];
      this.rows = [];
      return;
    }
    this.loading = true;
    this.entityService.get(entityId).subscribe({
      next: (entity) => (this.fields = entity.fields),
      error: () => (this.fields = []),
    });
    this.entityService.listRecords(entityId, 0, this.pageSize()).subscribe({
      next: (result) => {
        this.rows = result.items;
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
      },
    });
  }

  private loadFromPage(pageId: string): void {
    if (!pageId) {
      this.fields = [];
      this.rows = [];
      return;
    }
    this.loading = true;
    this.pageData.getSchema(pageId).subscribe((schema) => {
      this.fields = schema.fields;
    });
    this.pageData.listSubmissions(pageId, 0, this.pageSize()).subscribe({
      next: (result) => {
        this.rows = result.items;
        this.loading = false;
      },
      error: () => {
        this.rows = [];
        this.loading = false;
      },
    });
  }

  /** Prefer entity mode when a source entity is chosen or sourceType='entity'. */
  protected useEntitySource(): boolean {
    const sourceType = stringProp(this.node().props, 'sourceType', '');
    if (sourceType === 'entity') {
      return true;
    }
    if (sourceType === 'page') {
      return false;
    }
    return !!this.sourceEntityId();
  }

  protected hasSource(): boolean {
    return this.useEntitySource() ? !!this.sourceEntityId() : !!this.sourcePageId();
  }

  protected sourceEntityId(): string {
    return stringProp(this.node().props, 'sourceEntityId', '');
  }

  protected sourcePageId(): string {
    return stringProp(this.node().props, 'sourcePageId', '');
  }

  protected pageSize(): number {
    return numberProp(this.node().props, 'pageSize', 50);
  }
}
