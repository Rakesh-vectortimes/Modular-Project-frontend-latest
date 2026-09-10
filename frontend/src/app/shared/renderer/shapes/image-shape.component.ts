import { Component, input } from '@angular/core';

import { RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-image-shape',
  standalone: true,
  template: `
    @if (src()) {
      <img class="image" [src]="src()" [alt]="alt()" [style.objectFit]="fit()" />
    } @else {
      <div class="image placeholder">
        <span class="ph-title">{{ alt() || 'Company Logo' }}</span>
        <span class="ph-hint">Set Image URL in Properties</span>
      </div>
    }
  `,
  styles: `
    .image {
      display: block;
      width: 100%;
      height: 100%;
    }
    .placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      min-height: 100%;
      background: #f1f5f9;
      border: 1px dashed #cbd5e1;
      border-radius: 6px;
      color: #64748b;
      box-sizing: border-box;
      padding: 0.35rem;
      text-align: center;
    }
    .ph-title {
      font-size: 0.75rem;
      font-weight: 600;
    }
    .ph-hint {
      font-size: 0.625rem;
      color: #94a3b8;
    }
  `,
})
export class ImageShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected src(): string {
    return stringProp(this.node().props, 'src', '');
  }

  protected alt(): string {
    return stringProp(this.node().props, 'alt', 'Company Logo');
  }

  protected fit(): string {
    return stringProp(this.node().props, 'fit', 'contain');
  }
}
