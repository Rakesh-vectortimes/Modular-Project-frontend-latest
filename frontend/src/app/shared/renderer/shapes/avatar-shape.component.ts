import { Component, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-avatar-shape',
  standalone: true,
  template: `
    <div
      class="avatar"
      [class.square]="shape() === 'square'"
      [style.width.px]="size()"
      [style.height.px]="size()"
    >
      @if (src()) {
        <img [src]="src()" [alt]="initials()" />
      } @else {
        <span>{{ initials() }}</span>
      }
    </div>
  `,
  styles: `
    .avatar {
      border-radius: 50%;
      background: #17a2b8;
      color: #fff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      overflow: hidden;
    }
    .avatar.square {
      border-radius: 8px;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  `,
})
export class AvatarShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected src(): string {
    return stringProp(this.node().props, 'src', '');
  }

  protected initials(): string {
    return stringProp(this.node().props, 'initials', 'AB');
  }

  protected shape(): string {
    return stringProp(this.node().props, 'shape', 'circle');
  }

  protected size(): number {
    return numberProp(this.node().props, 'size', 40);
  }
}
