import { Component, forwardRef, inject, input } from '@angular/core';

import { ComponentAction, RuntimeActionService } from '../../core/services/runtime-action.service';
import { RuntimeContextService } from '../../core/services/runtime-context.service';
import { ComponentRendererComponent } from '../../shared/renderer/component-renderer.component';
import { RenderNode } from '../../shared/renderer/render-node.model';

/**
 * Component types that render their own interactive control and already fire
 * their `action` on click (see their shape components). The generic wrapper
 * below must NOT also trigger these, or the action would run twice.
 */
const SELF_HANDLING_TYPES = new Set(['button', 'link_button', 'social_login_button']);

/**
 * Recursively renders a `RenderNode` tree in Run/Preview mode. Every node is
 * absolutely positioned by its x/y/w/h — root nodes relative to the page
 * canvas, nested nodes relative to their parent container's box — mirroring
 * the free-positioning builder canvas so the preview matches what was designed.
 *
 * Any node that has an `action` configured (via the builder's universal
 * "Actions" panel) becomes clickable here: clicking it runs the action through
 * `RuntimeActionService`. Buttons / link buttons / social login buttons keep
 * firing their own action (they render a real interactive control), so the
 * wrapper skips those types to avoid double-triggering.
 */
@Component({
  selector: 'app-runtime-node',
  standalone: true,
  imports: [ComponentRendererComponent, forwardRef(() => RuntimeNodeComponent)],
  template: `
    <div
      class="runtime-node"
      [class.actionable]="actionable()"
      [style.left.px]="node().position.x"
      [style.top.px]="node().position.y"
      [style.width.px]="node().position.w"
      [style.height.px]="node().position.h"
      (click)="onClick($event)"
    >
      <app-component-renderer [node]="node()" [interactive]="true" />
      @if (node().children.length) {
        <div class="runtime-children">
          @for (child of node().children; track child.id) {
            <app-runtime-node [node]="child" />
          }
        </div>
      }
    </div>
  `,
  styles: `
    .runtime-node {
      position: absolute;
      box-sizing: border-box;
    }
    .runtime-node.actionable {
      cursor: pointer;
    }
    .runtime-children {
      position: absolute;
      inset: 0;
    }
  `,
})
export class RuntimeNodeComponent {
  private readonly runtimeActions = inject(RuntimeActionService);
  private readonly runtimeContext = inject(RuntimeContextService);

  readonly node = input.required<RenderNode>();
  readonly isRoot = input(false);

  private action(): ComponentAction | null {
    const value = this.node().props['action'];
    return value && typeof value === 'object' ? (value as ComponentAction) : null;
  }

  /** True when this node type doesn't self-handle and has a real action set. */
  protected actionable(): boolean {
    if (SELF_HANDLING_TYPES.has(this.node().component_type)) {
      return false;
    }
    const action = this.action();
    return !!action && !!action.actionType && action.actionType !== 'none';
  }

  protected onClick(event: MouseEvent): void {
    if (!this.actionable()) {
      return;
    }
    const softwareId = this.runtimeContext.softwareId();
    const pageId = this.runtimeContext.pageId();
    if (!softwareId || !pageId) {
      return;
    }
    // Only the innermost actionable node should respond, so a click on a
    // clickable child doesn't also fire an actionable ancestor's action.
    event.stopPropagation();
    this.runtimeActions.trigger(this.action(), { softwareId, pageId });
  }
}
