import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { listProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-radio-group-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <fieldset class="radio-group" [class.horizontal]="layout() === 'horizontal'">
      <legend>{{ label() }}</legend>
      @for (opt of options(); track opt) {
        <label>
          <input
            type="radio"
            [name]="'rg-' + node().id"
            [value]="opt"
            [disabled]="!interactive()"
            [ngModel]="value"
            (ngModelChange)="onValueChange($event)"
          />
          <span>{{ opt }}</span>
        </label>
      }
    </fieldset>
  `,
  styles: `
    .radio-group {
      border: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .radio-group.horizontal {
      flex-direction: row;
      flex-wrap: wrap;
      gap: 1rem;
    }
    legend {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.25rem;
    }
    label {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.875rem;
      color: #4b5563;
    }
  `,
})
export class RadioGroupShapeComponent {
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
    return stringProp(this.node().props, 'label', 'Radio Group');
  }

  protected options(): string[] {
    return listProp(this.node().props, 'options');
  }

  protected layout(): string {
    return stringProp(this.node().props, 'layout', 'vertical');
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
