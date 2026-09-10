import { DatePipe } from '@angular/common';
import { Component, OnChanges, inject, input } from '@angular/core';

import {
  PageDataFieldSpec,
  PageDataService,
  SubmissionRead,
} from '../../../core/services/page-data.service';
import { numberProp, RenderNode, stringProp } from '../render-node.model';

/**
 * Shows the submissions captured by another page's auto-created data
 * collection (design doc §6) — e.g. drop this on a Dashboard page to show
 * signups captured on a Login/signup page.
 */
@Component({
  selector: 'app-data-table-shape',
  standalone: true,
  imports: [DatePipe],
  template: `
    <div class="data-table">
      @if (!sourcePageId()) {
        <p class="empty">Choose a source page in Properties.</p>
      } @else if (loading) {
        <p class="empty">Loading…</p>
      } @else if (!fields.length) {
        <p class="empty">The source page has no captured fields yet.</p>
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

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected fields: PageDataFieldSpec[] = [];
  protected rows: SubmissionRead[] = [];
  protected loading = false;

  ngOnChanges(): void {
    const pageId = this.sourcePageId();
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

  protected sourcePageId(): string {
    return stringProp(this.node().props, 'sourcePageId', '');
  }

  protected pageSize(): number {
    return numberProp(this.node().props, 'pageSize', 50);
  }
}
