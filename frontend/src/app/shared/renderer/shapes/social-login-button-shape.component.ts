import { Component, inject, input } from '@angular/core';

import { ComponentAction, RuntimeActionService } from '../../../core/services/runtime-action.service';
import { RuntimeContextService } from '../../../core/services/runtime-context.service';
import { RENDERER_SOCIAL_BUTTON_STYLES } from '../renderer-form.styles';
import { RenderNode, stringProp } from '../render-node.model';

const PROVIDER_LABELS: Record<string, string> = {
  google: 'Continue with Google',
  microsoft: 'Continue with Microsoft',
  github: 'Continue with GitHub',
  facebook: 'Continue with Facebook',
  twitter: 'Continue with X',
  apple: 'Continue with Apple',
  linkedin: 'Continue with LinkedIn',
};

@Component({
  selector: 'app-social-login-button-shape',
  standalone: true,
  template: `
    <div class="social-stack">
      @for (p of providers(); track p) {
        <button
          type="button"
          class="social-btn"
          [class]="'provider-' + p"
          [disabled]="!interactive()"
          (click)="onProviderClick(p)"
        >
          {{ buttonLabel(p) }}
        </button>
      }
    </div>
  `,
  styles: RENDERER_SOCIAL_BUTTON_STYLES,
})
export class SocialLoginButtonShapeComponent {
  private readonly runtimeActions = inject(RuntimeActionService);
  private readonly runtimeContext = inject(RuntimeContextService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  private static readonly PROVIDER_ORDER = [
    'google',
    'facebook',
    'twitter',
    'microsoft',
    'github',
    'apple',
    'linkedin',
  ];

  protected providers(): string[] {
    const raw = this.node().props['providers'];
    const selected = Array.isArray(raw)
      ? raw.map(String)
      : [stringProp(this.node().props, 'provider', 'google')];
    const known = new Set(selected.filter((p) => PROVIDER_LABELS[p]));
    const ordered = SocialLoginButtonShapeComponent.PROVIDER_ORDER.filter((p) =>
      known.has(p),
    );
    return ordered.length ? ordered : ['google'];
  }

  protected buttonLabel(provider: string): string {
    const custom = stringProp(this.node().props, 'label', '').trim();
    if (custom && this.providers().length === 1) {
      return custom;
    }
    return PROVIDER_LABELS[provider] ?? PROVIDER_LABELS['google'];
  }

  protected onProviderClick(provider: string): void {
    if (!this.interactive()) {
      return;
    }
    const softwareId = this.runtimeContext.softwareId();
    const pageId = this.runtimeContext.pageId();
    if (!softwareId || !pageId) {
      return;
    }
    const action = this.node().props['action'] as ComponentAction | undefined;
    this.runtimeActions.startSocialLogin(provider, { softwareId, pageId }, action);
  }
}
