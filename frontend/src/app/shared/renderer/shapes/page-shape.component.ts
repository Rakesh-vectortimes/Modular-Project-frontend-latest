import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

/**
 * Full website page frame — drop this from Layout, then build the page
 * contents inside it (sections, forms, etc.). Publish shows this page
 * filling the browser.
 */
@Component({
  selector: 'app-page-shape',
  standalone: true,
  template: `
    <div
      class="page"
      [style.backgroundColor]="backgroundColor()"
      [style.backgroundImage]="backgroundImageStyle()"
      [style.padding.px]="padding()"
    >
      @if (showLabel()) {
        <div class="page-label">{{ label() }}</div>
      }
      <ng-content />
    </div>
  `,
  styles: `
    .page {
      width: 100%;
      height: 100%;
      min-height: 100%;
      box-sizing: border-box;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
      position: relative;
    }
    .page-label {
      position: absolute;
      top: 0.75rem;
      left: 0.75rem;
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
      pointer-events: none;
      z-index: 0;
    }
  `,
})
export class PageShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Page');
  }

  protected backgroundColor(): string {
    return stringProp(this.node().props, 'backgroundColor', '#f4f6f9');
  }

  protected backgroundImageStyle(): string | null {
    const url = stringProp(this.node().props, 'backgroundImage', '').trim();
    return url ? `url(${url})` : null;
  }

  protected padding(): number {
    return numberProp(this.node().props, 'padding', 0);
  }

  protected showLabel(): boolean {
    const value = this.label().trim();
    return value.length > 0 && value.toLowerCase() !== 'page';
  }
}
