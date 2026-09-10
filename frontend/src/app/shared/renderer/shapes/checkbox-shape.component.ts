import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { booleanProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-checkbox-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="checkbox">
      <input
        type="checkbox"
        [disabled]="!interactive()"
        [ngModel]="checked"
        (ngModelChange)="onValueChange($event)"
      />
      <span>{{ label() }}</span>
    </label>
  `,
  styles: `
    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.875rem;
      color: #374151;
      cursor: pointer;
    }
  `,
})
export class CheckboxShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected checked = false;

  constructor() {
    effect(() => {
      this.checked = booleanProp(this.node().props, 'defaultValue');
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Checkbox');
  }

  protected onValueChange(checked: boolean): void {
    this.checked = checked;
    if (this.interactive()) {
      const fieldKey = stringProp(this.node().props, 'fieldKey', '');
      if (fieldKey) {
        this.formState.setValue(fieldKey, checked);
      }
    }
  }
}
