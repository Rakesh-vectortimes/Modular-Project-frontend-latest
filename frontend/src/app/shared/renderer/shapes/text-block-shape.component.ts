import { Component, computed, input } from '@angular/core';

import { delegateNode, variantProp } from '../generic-delegate.util';
import { RenderNode, stringProp } from '../render-node.model';
import { HeadingShapeComponent } from './heading-shape.component';
import { TextShapeComponent } from './text-shape.component';

@Component({
  selector: 'app-text-block-shape',
  standalone: true,
  imports: [HeadingShapeComponent, TextShapeComponent],
  template: `
    @if (isHeading()) {
      <app-heading-shape [node]="legacy()" [interactive]="interactive()" />
    } @else {
      <app-text-shape [node]="legacy()" [interactive]="interactive()" />
    }
  `,
})
export class TextBlockShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected textType = computed(() => variantProp(this.node(), 'textType', 'body'));

  protected isHeading = computed(() => {
    const t = this.textType();
    return t === 'h1' || t === 'h2' || t === 'h3' || t === 'h4';
  });

  protected legacy = computed(() => {
    const n = this.node();
    if (this.isHeading()) {
      return delegateNode(n, 'heading', {
        content: stringProp(n.props, 'content', 'Heading'),
        level: this.textType(),
        align: stringProp(n.props, 'align', 'left'),
        color: stringProp(n.props, 'color', '#111827'),
        binding: stringProp(n.props, 'binding', ''),
      });
    }
    return delegateNode(n, 'text', {
      content: stringProp(n.props, 'content', 'Text content'),
      fontSize: n.props['fontSize'] ?? (this.textType() === 'label' ? 14 : 16),
      fontWeight: n.props['fontWeight'] ?? (this.textType() === 'label' ? '600' : 'normal'),
      color: stringProp(n.props, 'color', '#333333'),
      textAlign: stringProp(n.props, 'textAlign', 'left'),
      binding: stringProp(n.props, 'binding', ''),
    });
  });
}
