import { Component, inject, input } from '@angular/core';

import { ComponentAction, RuntimeActionService } from '../../../core/services/runtime-action.service';
import { RuntimeContextService } from '../../../core/services/runtime-context.service';
import { RENDERER_PRIMARY_BUTTON_STYLES } from '../renderer-form.styles';
import { RenderNode, stringProp } from '../render-node.model';
import { SocialLoginButtonShapeComponent } from './social-login-button-shape.component';

@Component({
  selector: 'app-button-shape',
  standalone: true,
  imports: [SocialLoginButtonShapeComponent],
  template: `
    @if (isSocial()) {
      <app-social-login-button-shape [node]="node()" [interactive]="interactive()" />
    } @else if (isLink()) {
      <button type="button" class="link-btn" [disabled]="!interactive()" (click)="onClick()">
        {{ label() }}
      </button>
    } @else {
      <button
        type="button"
        class="btn"
        [class]="variantClass()"
        [disabled]="!interactive()"
        (click)="onClick()"
      >
        {{ label() }}
      </button>
    }
  `,
  styles: [
    RENDERER_PRIMARY_BUTTON_STYLES,
    `
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
  ],
})
export class ButtonShapeComponent {
  private readonly runtimeActions = inject(RuntimeActionService);
  private readonly runtimeContext = inject(RuntimeContextService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Click Me');
  }

  protected isSocial(): boolean {
    return stringProp(this.node().props, 'appearance', 'button') === 'social';
  }

  protected isLink(): boolean {
    return stringProp(this.node().props, 'appearance', 'button') === 'link';
  }

  protected variantClass(): string {
    const variant = stringProp(this.node().props, 'variant', 'primary');
    const allowed = ['primary', 'secondary', 'outline', 'danger'];
    return allowed.includes(variant) ? variant : 'primary';
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
