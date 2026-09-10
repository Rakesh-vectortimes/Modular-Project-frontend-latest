import { NgComponentOutlet, NgStyle } from '@angular/common';
import { Component, inject, input } from '@angular/core';

import { COMPONENT_TYPE_REGISTRY } from './component-type-registry';
import { RenderNode } from './render-node.model';
import { styleBucketToCss } from './style.util';

@Component({
  selector: 'app-component-renderer',
  standalone: true,
  imports: [NgComponentOutlet, NgStyle],
  template: `
    <div class="style-host" [ngStyle]="hostStyle()">
      @if (shapeComponent(); as component) {
        <ng-container *ngComponentOutlet="component; inputs: shapeInputs()" />
      } @else {
        <div class="unknown-type">Unknown: {{ node().component_type }}</div>
      }
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
    .style-host {
      width: 100%;
      height: 100%;
    }
    .unknown-type {
      padding: 0.5rem;
      font-size: 0.75rem;
      color: #dc2626;
      background: #fef2f2;
      border-radius: 4px;
    }
  `,
})
export class ComponentRendererComponent {
  private readonly registry = inject(COMPONENT_TYPE_REGISTRY);

  readonly node = input.required<RenderNode>();
  /** When true, form controls are interactive (published app). */
  readonly interactive = input(false);

  protected shapeComponent() {
    return this.registry.get(this.node().component_type) ?? null;
  }

  protected shapeInputs(): { node: RenderNode; interactive: boolean } {
    return { node: this.node(), interactive: this.interactive() };
  }

  /** Universal Appearance styling (see style-schema.ts) applied to every component. */
  protected hostStyle(): Record<string, string> {
    return styleBucketToCss(this.node().props['style']);
  }
}
