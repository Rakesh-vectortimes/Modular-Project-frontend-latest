import { Component, input, signal } from '@angular/core';

import { listProp, RenderNode } from '../render-node.model';

@Component({
  selector: 'app-accordion-shape',
  standalone: true,
  template: `
    <div class="accordion">
      @for (item of items(); track $index; let i = $index) {
        <div class="panel" [class.open]="openIndex() === i">
          <button type="button" class="panel-header" (click)="toggle(i)">
            <span>{{ item }}</span>
            <span class="chevron">{{ openIndex() === i ? '▾' : '▸' }}</span>
          </button>
          @if (openIndex() === i) {
            <div class="panel-body">Content for "{{ item }}" goes here.</div>
          }
        </div>
      }
    </div>
  `,
  styles: `
    .accordion {
      width: 100%;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .panel + .panel {
      border-top: 1px solid #e5e7eb;
    }
    .panel-header {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.625rem 0.75rem;
      background: #f9fafb;
      border: none;
      font-size: 0.8125rem;
      font-weight: 600;
      color: #1f2937;
      cursor: pointer;
      text-align: left;
    }
    .panel.open .panel-header {
      background: #f1f5f9;
    }
    .chevron {
      color: #6b7280;
      font-size: 0.7rem;
    }
    .panel-body {
      padding: 0.625rem 0.75rem;
      font-size: 0.8125rem;
      color: #6b7280;
    }
  `,
})
export class AccordionShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected readonly openIndex = signal(0);

  protected items(): string[] {
    const items = listProp(this.node().props, 'items');
    return items.length ? items : ['Section 1'];
  }

  protected toggle(index: number): void {
    this.openIndex.set(this.openIndex() === index ? -1 : index);
  }
}
