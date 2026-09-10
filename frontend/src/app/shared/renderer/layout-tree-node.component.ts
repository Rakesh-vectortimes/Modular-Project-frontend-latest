import { Component, forwardRef, input } from '@angular/core';

import { ComponentRendererComponent } from './component-renderer.component';
import { RenderNode } from './render-node.model';

@Component({
  selector: 'app-layout-tree-node',
  standalone: true,
  imports: [
    ComponentRendererComponent,
    forwardRef(() => LayoutTreeNodeComponent),
  ],
  templateUrl: './layout-tree-node.component.html',
  styleUrl: './layout-tree-node.component.scss',
})
export class LayoutTreeNodeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);
  readonly isRoot = input(false);
}
