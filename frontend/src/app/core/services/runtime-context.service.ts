import { Injectable, signal } from '@angular/core';

import { RenderNode } from '../../shared/renderer/render-node.model';

/**
 * Current software/page context while in Run/Preview mode — set by
 * `RuntimeShellComponent` from the route params, read by any interactive
 * shape component (Button, Link Button, Social Login Button) that needs to
 * know "which software and page am I running inside of" to resolve a
 * `navigate` action or a `submit` action's target page.
 */
@Injectable({ providedIn: 'root' })
export class RuntimeContextService {
  private readonly _softwareId = signal<string | null>(null);
  private readonly _pageId = signal<string | null>(null);
  private readonly _layoutNodes = signal<RenderNode[]>([]);

  readonly softwareId = this._softwareId.asReadonly();
  readonly pageId = this._pageId.asReadonly();
  readonly layoutNodes = this._layoutNodes.asReadonly();

  set(softwareId: string, pageId: string): void {
    this._softwareId.set(softwareId);
    this._pageId.set(pageId);
  }

  setLayout(nodes: RenderNode[]): void {
    this._layoutNodes.set(nodes);
  }

  clear(): void {
    this._softwareId.set(null);
    this._pageId.set(null);
    this._layoutNodes.set([]);
  }
}
