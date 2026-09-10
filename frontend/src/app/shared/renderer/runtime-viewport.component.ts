import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  input,
  signal,
  viewChild,
} from '@angular/core';

/**
 * Maps the designed page frame onto the full browser window (100vw × 100vh).
 * Stretches to fill — no letterbox margins.
 */
@Component({
  selector: 'app-runtime-viewport',
  standalone: true,
  template: `
    <div #viewport class="viewport">
      <div
        class="stage"
        [style.width.px]="contentWidth()"
        [style.height.px]="contentHeight()"
        [style.transform]="stageTransform()"
      >
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    .viewport {
      position: relative;
      width: 100%;
      height: 100vh;
      overflow: hidden;
    }
    .stage {
      position: absolute;
      top: 0;
      left: 0;
      transform-origin: 0 0;
    }
  `,
})
export class RuntimeViewportComponent implements AfterViewInit, OnDestroy {
  readonly contentWidth = input(0);
  readonly contentHeight = input(0);

  private readonly viewport = viewChild<ElementRef<HTMLElement>>('viewport');
  private readonly viewportSize = signal({ w: 0, h: 0 });
  private resizeObserver?: ResizeObserver;

  protected readonly stageTransform = computed(() => {
    const width = this.contentWidth();
    const height = this.contentHeight();
    const { w, h } = this.viewportSize();
    if (!width || !height || !w || !h) {
      return 'none';
    }
    const scaleX = w / width;
    const scaleY = h / height;
    return `scale(${scaleX}, ${scaleY})`;
  });

  ngAfterViewInit(): void {
    const el = this.viewport()?.nativeElement;
    if (!el || typeof ResizeObserver === 'undefined') {
      this.viewportSize.set({
        w: window.innerWidth,
        h: window.innerHeight,
      });
      return;
    }
    this.resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) {
        return;
      }
      const { width, height } = entry.contentRect;
      this.viewportSize.set({
        w: Math.max(0, width),
        h: Math.max(0, height),
      });
    });
    this.resizeObserver.observe(el);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }
}
