import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-icon-shape',
  standalone: true,
  template: `
    <span class="icon" [style.fontSize.px]="size()" [style.color]="color()">{{ glyph() }}</span>
  `,
  styles: `
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }
  `,
})
export class IconShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected glyph(): string {
    return stringProp(this.node().props, 'glyph', '★');
  }

  protected size(): number {
    return numberProp(this.node().props, 'size', 24);
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#17a2b8');
  }
}
