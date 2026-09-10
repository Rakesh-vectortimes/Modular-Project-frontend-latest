import { Component, computed, input } from '@angular/core';

import { delegateNode, variantProp } from '../generic-delegate.util';
import { RenderNode } from '../render-node.model';
import { AccordionShapeComponent } from './accordion-shape.component';
import { BreadcrumbShapeComponent } from './breadcrumb-shape.component';
import { DataTableShapeComponent } from './data-table-shape.component';
import { KanbanShapeComponent } from './kanban-shape.component';
import { NavbarShapeComponent } from './navbar-shape.component';
import { StepperShapeComponent } from './stepper-shape.component';
import { TabsShapeComponent } from './tabs-shape.component';

@Component({
  selector: 'app-widget-shape',
  standalone: true,
  imports: [
    DataTableShapeComponent,
    KanbanShapeComponent,
    NavbarShapeComponent,
    TabsShapeComponent,
    AccordionShapeComponent,
    StepperShapeComponent,
    BreadcrumbShapeComponent,
  ],
  template: `
    @switch (widgetType()) {
      @case ('kanban') {
        <app-kanban-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('navbar') {
        <app-navbar-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('tabs') {
        <app-tabs-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('accordion') {
        <app-accordion-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('stepper') {
        <app-stepper-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('breadcrumb') {
        <app-breadcrumb-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @default {
        <app-data-table-shape [node]="legacy()" [interactive]="interactive()" />
      }
    }
  `,
})
export class WidgetShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected widgetType = computed(() => variantProp(this.node(), 'widgetType', 'data_table'));

  protected legacy = computed(() => {
    const n = this.node();
    const kind = this.widgetType();
    const typeMap: Record<string, string> = {
      data_table: 'data_table',
      kanban: 'kanban_board',
      navbar: 'navbar',
      tabs: 'tabs',
      accordion: 'accordion',
      stepper: 'stepper',
      breadcrumb: 'breadcrumb',
    };
    return delegateNode(n, typeMap[kind] ?? 'data_table');
  });
}
