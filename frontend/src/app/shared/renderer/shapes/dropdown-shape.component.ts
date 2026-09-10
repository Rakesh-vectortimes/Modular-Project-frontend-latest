import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { RENDERER_FIELD_STYLES } from '../renderer-form.styles';
import { listProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-dropdown-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <select [disabled]="!interactive()" [ngModel]="value" (ngModelChange)="onValueChange($event)">
        <option value="">{{ placeholder() }}</option>
        @for (opt of options(); track opt) {
          <option [value]="opt">{{ opt }}</option>
        }
      </select>
    </label>
  `,
  styles: RENDERER_FIELD_STYLES,
})
export class DropdownShapeComponent {
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
    return stringProp(this.node().props, 'label', 'Dropdown');
  }

  /** Hide the built-in label when it's blank, so the input can be used on its
   *  own (paired with a separate Text/Label component). */
  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', 'Select...');
  }

  protected options(): string[] {
    return listProp(this.node().props, 'options');
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
