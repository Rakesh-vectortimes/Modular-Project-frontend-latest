import { Component, computed, input } from '@angular/core';

import { delegateNode, variantProp } from '../generic-delegate.util';
import { RenderNode } from '../render-node.model';
import { CardShapeComponent } from './card-shape.component';
import { PageShapeComponent } from './page-shape.component';
import { RowShapeComponent } from './row-shape.component';
import { SectionShapeComponent } from './section-shape.component';

@Component({
  selector: 'app-container-shape',
  standalone: true,
  imports: [SectionShapeComponent, RowShapeComponent, CardShapeComponent, PageShapeComponent],
  template: `
    @switch (containerType()) {
      @case ('row') {
        <app-row-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('card') {
        <app-card-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('page') {
        <app-page-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @default {
        <app-section-shape [node]="legacy()" [interactive]="interactive()" />
      }
    }
  `,
})
export class ContainerShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected containerType = computed(() => variantProp(this.node(), 'containerType', 'section'));

  protected legacy = computed(() => {
    const n = this.node();
    const kind = this.containerType();
    const typeMap: Record<string, string> = {
      section: 'section',
      header: 'section',
      footer: 'section',
      sidebar: 'section',
      row: 'row',
      card: 'card',
      page: 'page',
    };
    return delegateNode(n, typeMap[kind] ?? 'section');
  });
}
