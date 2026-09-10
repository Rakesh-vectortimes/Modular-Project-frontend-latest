import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-number-input-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <input
        type="number"
        [readonly]="!interactive()"
        [placeholder]="placeholder()"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      />
    </label>
  `,
  styles: `
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
      height: 100%;
      min-height: 0;
      box-sizing: border-box;
    }
    .label {
      flex: 0 0 auto;
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    input {
      flex: 0 1 auto;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0.5rem 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: #fff;
    }
    input[readonly] {
      pointer-events: none;
    }
  `,
})
export class NumberInputShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected value: number | null = null;

  constructor() {
    effect(() => {
      const raw = this.node().props['defaultValue'];
      this.value = typeof raw === 'number' ? raw : null;
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Number');
  }

  /** Hide the built-in label when it's blank, so the input can be used on its
   *  own (paired with a separate Text/Label component). */
  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', '0');
  }

  protected onValueChange(value: string | number | null): void {
    const num = value === '' || value === null ? null : Number(value);
    this.value = Number.isFinite(num) ? num : null;
    if (this.interactive()) {
      const fieldKey = stringProp(this.node().props, 'fieldKey', '');
      if (fieldKey) {
        this.formState.setValue(fieldKey, this.value);
      }
    }
  }
}
