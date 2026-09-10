import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-divider-shape',
  standalone: true,
  template: `
    <div
      class="divider"
      [style.borderTopWidth.px]="thickness()"
      [style.borderTopStyle]="lineStyle()"
      [style.borderTopColor]="color()"
    ></div>
  `,
  styles: `
    .divider {
      width: 100%;
      border-top: 1px solid #e5e7eb;
    }
  `,
})
export class DividerShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected thickness(): number {
    return numberProp(this.node().props, 'thickness', 1);
  }

  protected lineStyle(): string {
    const value = stringProp(this.node().props, 'style', 'solid');
    const allowed = ['solid', 'dashed', 'dotted'];
    return allowed.includes(value) ? value : 'solid';
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#e5e7eb');
  }
}
