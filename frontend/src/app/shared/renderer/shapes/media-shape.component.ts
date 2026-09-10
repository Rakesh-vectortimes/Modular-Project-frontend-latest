import { Component, computed, input } from '@angular/core';

import { delegateNode, variantProp } from '../generic-delegate.util';
import { RenderNode } from '../render-node.model';
import { AvatarShapeComponent } from './avatar-shape.component';
import { IconShapeComponent } from './icon-shape.component';
import { ImageShapeComponent } from './image-shape.component';
import { VideoEmbedShapeComponent } from './video-embed-shape.component';

@Component({
  selector: 'app-media-shape',
  standalone: true,
  imports: [ImageShapeComponent, AvatarShapeComponent, IconShapeComponent, VideoEmbedShapeComponent],
  template: `
    @switch (mediaType()) {
      @case ('avatar') {
        <app-avatar-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('icon') {
        <app-icon-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @case ('video') {
        <app-video-embed-shape [node]="legacy()" [interactive]="interactive()" />
      }
      @default {
        <app-image-shape [node]="legacy()" [interactive]="interactive()" />
      }
    }
  `,
})
export class MediaShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected mediaType = computed(() => variantProp(this.node(), 'mediaType', 'image'));

  protected legacy = computed(() => {
    const n = this.node();
    const kind = this.mediaType();
    const typeMap: Record<string, string> = {
      image: 'image',
      avatar: 'avatar',
      icon: 'icon',
      video: 'video_embed',
    };
    return delegateNode(n, typeMap[kind] ?? 'image');
  });
}
