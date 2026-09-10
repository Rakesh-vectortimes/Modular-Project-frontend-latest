import { Component, computed, inject, input } from '@angular/core';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import {
  evaluateFormula,
  formatFormulaResult,
} from '../../../core/services/formula.util';
import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-heading-shape',
  standalone: true,
  template: `
    <div
      class="heading"
      [class]="level()"
      [style.textAlign]="align()"
      [style.color]="color()"
    >
      {{ content() }}
    </div>
  `,
  styles: `
    .heading {
      width: 100%;
      margin: 0;
      font-weight: 700;
      font-family: inherit;
      line-height: 1.25;
    }
    .h1 {
      font-size: 2rem;
    }
    .h2 {
      font-size: 1.5rem;
    }
    .h3 {
      font-size: 1.25rem;
    }
    .h4 {
      font-size: 1.05rem;
    }
  `,
})
export class HeadingShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected readonly content = computed(() => {
    const binding = stringProp(this.node().props, 'binding', '').trim();
    const staticText = stringProp(this.node().props, 'content', 'Heading');

    if (!binding) {
      return staticText;
    }

    if (this.interactive()) {
      const result = evaluateFormula(binding, this.formState.values());
      return result === null ? '' : formatFormulaResult(result);
    }

    return staticText && staticText !== 'Heading' ? staticText : `ƒ ${binding}`;
  });

  protected level(): string {
    const value = stringProp(this.node().props, 'level', 'h2');
    const allowed = ['h1', 'h2', 'h3', 'h4'];
    return allowed.includes(value) ? value : 'h2';
  }

  protected align(): string {
    const value = stringProp(this.node().props, 'align', 'left');
    const allowed = ['left', 'center', 'right'];
    return allowed.includes(value) ? value : 'left';
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#111827');
  }
}
