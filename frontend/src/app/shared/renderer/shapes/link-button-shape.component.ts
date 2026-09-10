import { Component, inject, input } from '@angular/core';

import { ComponentAction, RuntimeActionService } from '../../../core/services/runtime-action.service';
import { RuntimeContextService } from '../../../core/services/runtime-context.service';
import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-link-button-shape',
  standalone: true,
  template: `
    <button type="button" class="link-btn" [disabled]="!interactive()" (click)="onClick()">
      {{ label() }}
    </button>
  `,
  styles: `
    .link-btn {
      border: none;
      background: none;
      padding: 0;
      color: #17a2b8;
      font-size: 0.8125rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: underline;
    }
    .link-btn:disabled {
      cursor: default;
    }
  `,
})
export class LinkButtonShapeComponent {
  private readonly runtimeActions = inject(RuntimeActionService);
  private readonly runtimeContext = inject(RuntimeContextService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Forgot password?');
  }

  protected onClick(): void {
    if (!this.interactive()) {
      return;
    }
    const softwareId = this.runtimeContext.softwareId();
    const pageId = this.runtimeContext.pageId();
    if (!softwareId || !pageId) {
      return;
    }
    const action = this.node().props['action'] as ComponentAction | undefined;
    this.runtimeActions.trigger(action, { softwareId, pageId });
  }
}
