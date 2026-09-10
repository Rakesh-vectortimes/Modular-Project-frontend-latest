import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { RENDERER_FIELD_STYLES } from '../renderer-form.styles';
import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-email-input-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <input
        type="email"
        [readonly]="!interactive()"
        [placeholder]="placeholder()"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      />
    </label>
  `,
  styles: RENDERER_FIELD_STYLES,
})
export class EmailInputShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected value = '';

  constructor() {
    effect(() => {
      this.value = stringProp(this.node().props, 'defaultValue', '');
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Email');
  }

  /** Hide the built-in label when it's blank, so the input can be used on its
   *  own (paired with a separate Text/Label component). */
  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', 'you@example.com');
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
