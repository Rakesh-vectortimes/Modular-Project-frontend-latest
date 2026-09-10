import { Component, inject, input } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

import { booleanProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-video-embed-shape',
  standalone: true,
  template: `
    @if (url()) {
      <iframe
        class="video"
        [src]="embedUrl()"
        [attr.allow]="autoplay() ? 'autoplay; fullscreen' : 'fullscreen'"
        frameborder="0"
        allowfullscreen
      ></iframe>
    } @else {
      <div class="video placeholder">🎬 Add a video URL in Properties</div>
    }
  `,
  styles: `
    .video {
      width: 100%;
      height: 100%;
      border-radius: 6px;
      border: none;
    }
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      background: #111827;
      color: #9ca3af;
      font-size: 0.8125rem;
    }
  `,
})
export class VideoEmbedShapeComponent {
  private readonly sanitizer = inject(DomSanitizer);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected url(): string {
    return stringProp(this.node().props, 'url', '');
  }

  protected autoplay(): boolean {
    return booleanProp(this.node().props, 'autoplay');
  }

  /** Angular's iframe [src] binding requires a SafeResourceUrl — a plain string
   *  throws a runtime "unsafe value" error. The URL still comes from the page
   *  author (a builder property, not arbitrary end-user input), so trusting it
   *  here is the same level of trust already given to Image/src, Link Button
   *  URLs, etc. elsewhere in this app. */
  protected embedUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.url());
  }
}
