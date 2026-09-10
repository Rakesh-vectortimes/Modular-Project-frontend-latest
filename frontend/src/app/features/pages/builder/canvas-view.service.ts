import { Injectable, signal } from '@angular/core';

export interface SnapGuides {
  /** X coordinates (canvas units) to draw full-height vertical guide lines at. */
  v: number[];
  /** Y coordinates (canvas units) to draw full-width horizontal guide lines at. */
  h: number[];
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 2;

/**
 * Shared pan/zoom/snap-guide state for the builder canvas — scoped per
 * page-builder instance (provided alongside BuilderStateService) so both
 * CanvasComponent and every nested CanvasNodeComponent can read/write it via
 * DI instead of threading inputs through the recursive node tree.
 */
@Injectable()
export class CanvasViewService {
  readonly zoom = signal(1);
  readonly snapGuides = signal<SnapGuides>({ v: [], h: [] });

  setZoom(next: number): void {
    this.zoom.set(Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, next)));
  }

  zoomBy(factor: number): void {
    this.setZoom(this.zoom() * factor);
  }

  resetZoom(): void {
    this.zoom.set(1);
  }

  setSnapGuides(v: number[], h: number[]): void {
    this.snapGuides.set({ v, h });
  }

  clearSnapGuides(): void {
    this.snapGuides.set({ v: [], h: [] });
  }
}
