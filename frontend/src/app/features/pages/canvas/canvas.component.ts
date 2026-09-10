import {
  CdkDragDrop,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';

import { ComponentDefinitionRead } from '../../../core/models';
import { ARTBOARD_ORIGIN } from '../../../core/models';
import { ComponentDefinitionStoreService } from '../../../core/services/component-definition-store.service';
import { SelectionService } from '../../../core/services/selection.service';
import { BuilderStateService } from '../builder/builder-state.service';
import { BuilderNode, findInnermostContainerAt } from '../builder/builder.models';
import { CanvasViewService } from '../builder/canvas-view.service';
import { DropListRegistryService } from '../builder/drop-list-registry.service';
import { CanvasNodeComponent } from './canvas-node.component';

interface MarqueeRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

const ZOOM_STEP = 1.15;

@Component({
  selector: 'app-builder-canvas',
  standalone: true,
  imports: [CdkDropList, CanvasNodeComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss',
})
export class CanvasComponent implements OnInit, OnDestroy {
  protected readonly builderState = inject(BuilderStateService);
  protected readonly dropRegistry = inject(DropListRegistryService);
  protected readonly selection = inject(SelectionService);
  protected readonly canvasView = inject(CanvasViewService);
  private readonly definitionStore = inject(ComponentDefinitionStoreService);

  /** Shared with publish framing — page frame origin on the infinite canvas. */
  protected readonly artboardOrigin = ARTBOARD_ORIGIN;

  /** Buffer for palette drops only — root nodes are not list items. */
  protected readonly paletteDropBuffer: BuilderNode[] = [];

  /** Live marquee (rubber-band) selection rectangle, in screen px relative to
   *  the canvas surface's viewport — null when not marquee-selecting. */
  protected readonly marqueeRect = signal<MarqueeRect | null>(null);

  private readonly canvasSurface = viewChild<ElementRef<HTMLElement>>('canvasSurface');

  private marqueeOrigin = { x: 0, y: 0 };
  /** Set right after a real (non-trivial) marquee drag commits a selection,
   *  so the click event that fires immediately after mouseup on the same
   *  background element doesn't clear the selection we just made. */
  private suppressNextClick = false;
  private isPanning = false;
  private panOrigin = { x: 0, y: 0, scrollLeft: 0, scrollTop: 0 };

  private readonly onMarqueeMoveBound = (event: MouseEvent) => this.onMarqueeMove(event);
  private readonly onMarqueeEndBound = () => this.onMarqueeEnd();
  private readonly onPanMoveBound = (event: MouseEvent) => this.onPanMove(event);
  private readonly onPanEndBound = () => this.onPanEnd();

  ngOnInit(): void {
    this.dropRegistry.register('canvas-root');
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.onMarqueeMoveBound);
    document.removeEventListener('mouseup', this.onMarqueeEndBound);
    document.removeEventListener('mousemove', this.onPanMoveBound);
    document.removeEventListener('mouseup', this.onPanEndBound);
  }

  protected onCanvasClick(event: MouseEvent): void {
    if (this.suppressNextClick) {
      this.suppressNextClick = false;
      return;
    }

    const target = event.target as HTMLElement;
    if (
      target.classList.contains('canvas-surface') ||
      target.classList.contains('canvas-content') ||
      target.classList.contains('canvas-drop-zone') ||
      target.classList.contains('canvas-nodes-layer')
    ) {
      this.selection.clear();
    }
  }

  /** Middle-mouse (or empty-canvas left-drag) starts panning; plain
   *  left-drag on empty canvas starts a marquee multi-select instead. */
  protected onCanvasMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const isBackground =
      target.classList.contains('canvas-surface') ||
      target.classList.contains('canvas-content') ||
      target.classList.contains('canvas-drop-zone') ||
      target.classList.contains('canvas-nodes-layer');

    if (!isBackground) {
      return;
    }

    if (event.button === 1) {
      this.startPan(event);
      return;
    }

    if (event.button === 0) {
      this.startMarquee(event);
    }
  }

  /** Ctrl/Cmd + wheel zooms centered on the cursor (Figma-style); plain wheel
   *  keeps the browser's native scroll for panning. */
  protected onWheel(event: WheelEvent): void {
    if (!event.ctrlKey && !event.metaKey) {
      return;
    }
    event.preventDefault();

    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const cursorX = event.clientX - rect.left + canvas.scrollLeft;
    const cursorY = event.clientY - rect.top + canvas.scrollTop;

    const oldZoom = this.canvasView.zoom();
    const factor = event.deltaY < 0 ? ZOOM_STEP : 1 / ZOOM_STEP;
    this.canvasView.setZoom(oldZoom * factor);
    const newZoom = this.canvasView.zoom();

    canvas.scrollLeft = (cursorX * newZoom) / oldZoom - (event.clientX - rect.left);
    canvas.scrollTop = (cursorY * newZoom) / oldZoom - (event.clientY - rect.top);
  }

  protected zoomIn(): void {
    this.canvasView.zoomBy(ZOOM_STEP);
  }

  protected zoomOut(): void {
    this.canvasView.zoomBy(1 / ZOOM_STEP);
  }

  protected resetZoom(): void {
    this.canvasView.resetZoom();
  }

  protected zoomPercent(): number {
    return Math.round(this.canvasView.zoom() * 100);
  }

  private startPan(event: MouseEvent): void {
    event.preventDefault();
    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return;
    }
    this.isPanning = true;
    this.panOrigin = {
      x: event.clientX,
      y: event.clientY,
      scrollLeft: canvas.scrollLeft,
      scrollTop: canvas.scrollTop,
    };
    document.addEventListener('mousemove', this.onPanMoveBound);
    document.addEventListener('mouseup', this.onPanEndBound);
  }

  private onPanMove(event: MouseEvent): void {
    if (!this.isPanning) {
      return;
    }
    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return;
    }
    canvas.scrollLeft = this.panOrigin.scrollLeft - (event.clientX - this.panOrigin.x);
    canvas.scrollTop = this.panOrigin.scrollTop - (event.clientY - this.panOrigin.y);
  }

  private onPanEnd(): void {
    this.isPanning = false;
    document.removeEventListener('mousemove', this.onPanMoveBound);
    document.removeEventListener('mouseup', this.onPanEndBound);
  }

  private startMarquee(event: MouseEvent): void {
    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    this.marqueeOrigin = {
      x: event.clientX - rect.left + canvas.scrollLeft,
      y: event.clientY - rect.top + canvas.scrollTop,
    };
    this.marqueeRect.set({ left: this.marqueeOrigin.x, top: this.marqueeOrigin.y, width: 0, height: 0 });
    document.addEventListener('mousemove', this.onMarqueeMoveBound);
    document.addEventListener('mouseup', this.onMarqueeEndBound);
  }

  private onMarqueeMove(event: MouseEvent): void {
    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return;
    }
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left + canvas.scrollLeft;
    const y = event.clientY - rect.top + canvas.scrollTop;

    this.marqueeRect.set({
      left: Math.min(this.marqueeOrigin.x, x),
      top: Math.min(this.marqueeOrigin.y, y),
      width: Math.abs(x - this.marqueeOrigin.x),
      height: Math.abs(y - this.marqueeOrigin.y),
    });
  }

  private onMarqueeEnd(): void {
    const rect = this.marqueeRect();
    this.marqueeRect.set(null);
    document.removeEventListener('mousemove', this.onMarqueeMoveBound);
    document.removeEventListener('mouseup', this.onMarqueeEndBound);

    if (!rect || (rect.width < 4 && rect.height < 4)) {
      return;
    }

    this.suppressNextClick = true;

    const zoom = this.canvasView.zoom();
    const selLeft = rect.left / zoom;
    const selTop = rect.top / zoom;
    const selRight = (rect.left + rect.width) / zoom;
    const selBottom = (rect.top + rect.height) / zoom;

    const hits = this.builderState.nodes().filter((node) => {
      const { x, y, w, h } = node.position;
      return x < selRight && x + w > selLeft && y < selBottom && y + h > selTop;
    });

    this.selection.selectMany(hits.map((n) => n.id));
  }

  protected onPaletteDrop(event: CdkDragDrop<BuilderNode[]>): void {
    if (event.previousContainer.id !== 'palette-list') {
      return;
    }

    const definition = event.item.data as ComponentDefinitionRead;
    const canvasPoint = this.dropPointOnCanvas(event);

    // Page frames are always root-level full-page canvases (not nested).
    if (definition.type === 'page') {
      const settings = this.builderState.pageSettings();
      const newNode = this.builderState.addNode(
        definition,
        null,
        this.builderState.nodes().length,
      );
      this.builderState.updateNodePosition(newNode.id, {
        x: ARTBOARD_ORIGIN.x,
        y: ARTBOARD_ORIGIN.y,
        w: settings.viewportWidth,
        h: settings.viewportHeight,
      });
      return;
    }

    const containerHit = findInnermostContainerAt(
      this.builderState.nodes(),
      canvasPoint,
      (type) => this.definitionStore.isContainer(type),
    );

    if (containerHit) {
      const parent = containerHit.node;
      const newNode = this.builderState.addNode(
        definition,
        parent.id,
        parent.children.length,
      );
      this.builderState.updateNodePosition(newNode.id, {
        x: Math.max(0, Math.round(containerHit.localX)),
        y: Math.max(0, Math.round(containerHit.localY)),
      });
      return;
    }

    const newNode = this.builderState.addNode(
      definition,
      null,
      this.builderState.nodes().length,
    );
    this.builderState.updateNodePosition(newNode.id, canvasPoint);
  }

  private dropPointOnCanvas(event: CdkDragDrop<BuilderNode[]>): { x: number; y: number } {
    const canvas = this.canvasSurface()?.nativeElement;
    if (!canvas) {
      return { x: 24, y: 24 };
    }

    const zoom = this.canvasView.zoom();
    const rect = canvas.getBoundingClientRect();
    return {
      x: Math.max(0, Math.round((event.dropPoint.x - rect.left + canvas.scrollLeft) / zoom)),
      y: Math.max(0, Math.round((event.dropPoint.y - rect.top + canvas.scrollTop) / zoom)),
    };
  }
}
