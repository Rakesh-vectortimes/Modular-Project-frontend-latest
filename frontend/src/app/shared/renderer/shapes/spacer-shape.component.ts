import { Component, input } from '@angular/core';

import { numberProp, RenderNode } from '../render-node.model';

@Component({
  selector: 'app-spacer-shape',
  standalone: true,
  template: `<div class="spacer" [style.height.px]="height()"></div>`,
  styles: `
    .spacer {
      width: 100%;
    }
  `,
})
export class SpacerShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected height(): number {
    return numberProp(this.node().props, 'height', 24);
  }
}
