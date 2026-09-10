import { Component, effect, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { booleanProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-toggle-switch-shape',
  standalone: true,
  imports: [FormsModule],
  template: `
    <label class="toggle-row">
      <span class="switch" [class.on]="checked">
        <input
          type="checkbox"
          [disabled]="!interactive()"
          [ngModel]="checked"
          (ngModelChange)="onValueChange($event)"
        />
        <span class="track"><span class="thumb"></span></span>
      </span>
      <span class="label">{{ label() }}</span>
    </label>
  `,
  styles: `
    .toggle-row {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      cursor: pointer;
    }
    .switch {
      position: relative;
      display: inline-block;
      width: 2.25rem;
      height: 1.25rem;
    }
    .switch input {
      position: absolute;
      inset: 0;
      opacity: 0;
      margin: 0;
      cursor: pointer;
    }
    .track {
      position: absolute;
      inset: 0;
      background: #d1d5db;
      border-radius: 999px;
      transition: background 0.15s ease;
    }
    .switch.on .track {
      background: #17a2b8;
    }
    .thumb {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 1rem;
      height: 1rem;
      background: #fff;
      border-radius: 50%;
      transition: transform 0.15s ease;
    }
    .switch.on .thumb {
      transform: translateX(1rem);
    }
    .label {
      font-size: 0.875rem;
      color: #374151;
    }
  `,
})
export class ToggleSwitchShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected checked = false;

  constructor() {
    effect(() => {
      this.checked = booleanProp(this.node().props, 'defaultChecked');
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Toggle');
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
