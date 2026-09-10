import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-textarea-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">{{ label() }}</span>
      }
      <textarea
        [readonly]="!interactive()"
        [rows]="rows()"
        [placeholder]="placeholder()"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      ></textarea>
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
    textarea {
      flex: 1 1 auto;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      padding: 0.5rem 0.625rem;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      font-size: 0.875rem;
      background: #fff;
      resize: vertical;
    }
    textarea[readonly] {
      resize: none;
      pointer-events: none;
    }
  `,
})
export class TextareaShapeComponent {
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
    return stringProp(this.node().props, 'label', 'Long Text');
  }

  /** Hide the built-in label when it's blank, so the input can be used on its
   *  own (paired with a separate Text/Label component). */
  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', 'Enter details...');
  }

  protected rows(): number {
    return numberProp(this.node().props, 'rows', 4);
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
