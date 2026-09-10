import { Component, computed, input } from '@angular/core';

import { delegateNode, variantProp } from '../generic-delegate.util';
import { RenderNode } from '../render-node.model';
import { BadgeShapeComponent } from './badge-shape.component';
import { DividerShapeComponent } from './divider-shape.component';
import { ListShapeComponent } from './list-shape.component';
import { ProgressBarShapeComponent } from './progress-bar-shape.component';
import { RatingShapeComponent } from './rating-shape.component';
import { SpacerShapeComponent } from './spacer-shape.component';

@Component({
  selector: 'app-display-shape',
  standalone: true,
  imports: [
    BadgeShapeComponent,
    DividerShapeComponent,
    SpacerShapeComponent,
    ProgressBarShapeComponent,
    RatingShapeComponent,
    ListShapeComponent,
  ],
  template: `
    @switch (displayType()) {
      @case ('divider') {
        <app-divider-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('spacer') {
        <app-spacer-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('progress') {
        <app-progress-bar-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('rating') {
        <app-rating-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('list') {
        <app-list-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @default {
        <app-badge-shape [node]="legacy()" [interactive]="interactive()" />
      }
    }
  `,
})
export class DisplayShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected displayType = computed(() => variantProp(this.node(), 'displayType', 'badge'));

  protected legacy = computed(() => {
    const n = this.node();
    const kind = this.displayType();
    const typeMap: Record<string, string> = {
      badge: 'badge',
      divider: 'divider',
      spacer: 'spacer',
      progress: 'progress_bar',
      rating: 'rating',
      list: 'list',
    };
    return delegateNode(n, typeMap[kind] ?? 'badge');
  });
}
