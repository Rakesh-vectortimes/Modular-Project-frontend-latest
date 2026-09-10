import { Component, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { RENDERER_FIELD_STYLES } from '../renderer-form.styles';
import { booleanProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-password-input-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <div class="input-row">
        <input
          [type]="revealed() ? 'text' : 'password'"
          [readonly]="!interactive()"
          [placeholder]="placeholder()"
          [ngModel]="value"
          (ngModelChange)="onValueChange($event)"
        />
        @if (showToggle()) {
          <button type="button" class="toggle-btn" (click)="revealed.set(!revealed())">
            {{ revealed() ? 'Hide' : 'Show' }}
          </button>
        }
      </div>
    </label>
  `,
  styles: [
    RENDERER_FIELD_STYLES,
    `
      .input-row {
        display: flex;
        gap: 0.375rem;
        align-items: stretch;
      }
      .input-row input {
        flex: 1;
        min-width: 0;
      }
      .toggle-btn {
        flex: 0 0 auto;
        height: var(--renderer-input-height, 2.5rem);
        padding: 0 0.625rem;
        border: 1px solid var(--renderer-input-border, #d1d5db);
        border-radius: var(--renderer-input-radius, 6px);
        background: #f9fafb;
        font-size: 0.75rem;
        cursor: pointer;
      }
    `,
  ],
})
export class PasswordInputShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected value = '';
  protected readonly revealed = signal(false);

  constructor() {
    effect(() => {
      this.value = stringProp(this.node().props, 'defaultValue', '');
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Password');
  }

  /** Hide the built-in label when it's blank, so the input can be used on its
   *  own (paired with a separate Text/Label component). */
  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', 'Enter password');
  }

  protected showToggle(): boolean {
    return booleanProp(this.node().props, 'showToggle');
  }

  protected onValueChange(value: string): void {
    this.value = value;
    if (this.interactive()) {
      const fieldKey = stringProp(this.node().props, 'fieldKey', '');
      if (fieldKey) {
        this.formState.setValue(fieldKey, value);
      }
    }
  }
}
