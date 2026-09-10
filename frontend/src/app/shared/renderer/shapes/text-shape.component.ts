import { Component, computed, inject, input } from '@angular/core';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import {
  evaluateFormula,
  formatFormulaResult,
} from '../../../core/services/formula.util';
import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-text-shape',
  standalone: true,
  template: `
    <p
      class="text-block"
      [style.fontSize.px]="fontSize()"
      [style.fontWeight]="fontWeight()"
      [style.color]="color()"
      [style.textAlign]="textAlign()"
    >
      {{ content() }}
    </p>
  `,
  styles: `
    .text-block {
      margin: 0;
      width: 100%;
      word-break: break-word;
    }
  `,
})
export class TextShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  /** Displays the live formula result in Run mode when a `binding` is set,
   *  otherwise the static content. In the builder, a bound-but-empty node
   *  surfaces its formula (prefixed with ƒ) so the designer sees the binding. */
  protected readonly content = computed(() => {
    const binding = stringProp(this.node().props, 'binding', '').trim();
    const staticText = stringProp(this.node().props, 'content', 'Text content');

    if (!binding) {
      return staticText;
    }

    if (this.interactive()) {
      const result = evaluateFormula(binding, this.formState.values());
      return result === null ? '' : formatFormulaResult(result);
    }

    return staticText && staticText !== 'Text content' ? staticText : `ƒ ${binding}`;
  });

  protected fontSize(): number {
    return numberProp(this.node().props, 'fontSize', 16);
  }

  protected fontWeight(): string {
    return stringProp(this.node().props, 'fontWeight', 'normal');
  }

  protected color(): string {
    return stringProp(this.node().props, 'color', '#333333');
  }

  protected textAlign(): 'left' | 'center' | 'right' {
    const align = stringProp(this.node().props, 'textAlign', 'left');
    return align === 'center' || align === 'right' ? align : 'left';
  }
}
