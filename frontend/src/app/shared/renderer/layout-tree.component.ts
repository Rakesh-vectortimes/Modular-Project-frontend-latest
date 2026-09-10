import { Component, computed, input } from '@angular/core';

import { PageSettings } from '../../core/models';
import { frameLayoutToArtboard } from './layout-frame.util';
import { LayoutTreeNodeComponent } from './layout-tree-node.component';
import { RenderNode } from './render-node.model';
import { RuntimeViewportComponent } from './runtime-viewport.component';

@Component({
  selector: 'app-layout-tree',
  standalone: true,
  imports: [LayoutTreeNodeComponent, RuntimeViewportComponent],
  template: `
    <app-runtime-viewport
      [contentWidth]="framed().width"
      [contentHeight]="framed().height"
    >
      <div
        class="page-surface"
        [style.width.px]="framed().width"
        [style.height.px]="framed().height"
        [style.backgroundColor]="bgColor()"
        [style.backgroundImage]="bgImage()"
      >
        @for (node of framed().nodes; track node.id) {
          <app-layout-tree-node [node]="node" [interactive]="interactive()" [isRoot]="true" />
        }
      </div>
    </app-runtime-viewport>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      overflow: hidden;
      background: #f4f6f9;
    }
    .page-surface {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
  `,
})
export class LayoutTreeComponent {
  readonly nodes = input.required<RenderNode[]>();
  readonly interactive = input(false);
  readonly settings = input<PageSettings | null>(null);

  protected readonly framed = computed(() =>
    frameLayoutToArtboard(this.nodes(), this.settings()),
  );

  protected bgColor(): string {
    return this.settings()?.backgroundColor || '#f4f6f9';
  }

  protected bgImage(): string | null {
    const url = this.settings()?.backgroundImage?.trim();
    return url ? `url(${url})` : null;
  }
}
