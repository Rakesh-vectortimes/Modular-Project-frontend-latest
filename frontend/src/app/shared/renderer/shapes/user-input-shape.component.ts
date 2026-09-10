import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { delegateNode } from '../generic-delegate.util';
import { RENDERER_FIELD_STYLES } from '../renderer-form.styles';
import { booleanProp, RenderNode, stringProp } from '../render-node.model';
import { CheckboxShapeComponent } from './checkbox-shape.component';
import { DatePickerShapeComponent } from './date-picker-shape.component';
import { DropdownShapeComponent } from './dropdown-shape.component';
import { FileUploadShapeComponent } from './file-upload-shape.component';
import { NumberInputShapeComponent } from './number-input-shape.component';
import { RadioGroupShapeComponent } from './radio-group-shape.component';
import { TextareaShapeComponent } from './textarea-shape.component';
import { ToggleSwitchShapeComponent } from './toggle-switch-shape.component';

type SimpleInputKind = 'text' | 'email' | 'password' | 'phone' | 'url';
type DelegatedInputKind =
  | 'number'
  | 'textarea'
  | 'checkbox'
  | 'toggle'
  | 'dropdown'
  | 'radio'
  | 'date'
  | 'file';

@Component({
  selector: 'app-user-input-shape',
  standalone: true,
  imports: [
    FormsModule,
    NumberInputShapeComponent,
    TextareaShapeComponent,
    CheckboxShapeComponent,
    ToggleSwitchShapeComponent,
    DropdownShapeComponent,
    RadioGroupShapeComponent,
    DatePickerShapeComponent,
    FileUploadShapeComponent,
  ],
  template: `
    @switch (inputKind()) {
      @case ('number') {
        <app-number-input-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('textarea') {
        <app-textarea-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('checkbox') {
        <app-checkbox-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('toggle') {
        <app-toggle-switch-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('dropdown') {
        <app-dropdown-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('radio') {
        <app-radio-group-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('date') {
        <app-date-picker-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('file') {
        <app-file-upload-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @default {
        <label class="field">
          @if (hasLabel()) {
            <span class="label">{{ label() }}</span>
          }
          <div class="input-row">
            <input
              [type]="htmlInputType()"
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
      }
    }
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
export class UserInputShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected value = '';
  protected readonly revealed = signal(false);

  protected readonly inputKind = computed(() => stringProp(this.node().props, 'inputType', 'text'));

  protected legacy = computed(() => {
    const n = this.node();
    const kind = this.inputKind();
    const map: Record<string, string> = {
      number: 'number_input',
      textarea: 'textarea',
      checkbox: 'checkbox',
      toggle: 'toggle_switch',
      dropdown: 'dropdown',
      radio: 'radio_group',
      date: 'date_picker',
      file: 'file_upload',
    };
    return delegateNode(n, map[kind] ?? 'text_input');
  });

  constructor() {
    effect(() => {
      this.value = stringProp(this.node().props, 'defaultValue', '');
      this.revealed.set(false);
    });
  }

  protected label(): string {
    return stringProp(this.node().props, 'label', 'User Input');
  }

  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected placeholder(): string {
    return stringProp(this.node().props, 'placeholder', 'Enter value…');
  }

  protected showToggle(): boolean {
    if (this.inputKind() !== 'password') {
      return false;
    }
    const value = this.node().props['showToggle'];
    return value === undefined ? true : booleanProp(this.node().props, 'showToggle');
  }

  protected htmlInputType(): string {
    const kind = this.inputKind() as SimpleInputKind;
    switch (kind) {
      case 'email':
        return 'email';
      case 'password':
        return this.revealed() ? 'text' : 'password';
      case 'phone':
        return 'tel';
      case 'url':
        return 'url';
      default:
        return 'text';
    }
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
