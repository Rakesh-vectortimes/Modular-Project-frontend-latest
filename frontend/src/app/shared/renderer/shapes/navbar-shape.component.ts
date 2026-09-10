import { Component, input } from '@angular/core';

import { listProp, RenderNode, stringProp } from '../render-node.model';

/**
 * Simplified navbar: brand label + a list of link labels. Making each link
 * actually navigate to a specific page would need a per-item page picker
 * (today's `list` property editor only supports plain strings) — flagged as a
 * follow-up rather than built here to keep this component's scope contained.
 */
@Component({
  selector: 'app-navbar-shape',
  standalone: true,
  template: `
    <nav class="navbar" [style.backgroundColor]="backgroundColor()">
      <span class="brand">{{ brand() }}</span>
      <div class="links">
        @for (link of links(); track link) {
          <span class="link">{{ link }}</span>
        }
      </div>
    </nav>
  `,
  styles: `
    .navbar {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      color: #fff;
      border-radius: 8px;
    }
    .brand {
      font-weight: 700;
      font-size: 0.95rem;
    }
    .links {
      display: flex;
      gap: 1.25rem;
    }
    .link {
      font-size: 0.8125rem;
      color: #d1d5db;
    }
  `,
})
export class NavbarShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected brand(): string {
    return stringProp(this.node().props, 'brandLabel', 'My App');
  }

  protected links(): string[] {
    return listProp(this.node().props, 'links');
  }

  protected backgroundColor(): string {
    return stringProp(this.node().props, 'backgroundColor', '#111827');
  }
}
