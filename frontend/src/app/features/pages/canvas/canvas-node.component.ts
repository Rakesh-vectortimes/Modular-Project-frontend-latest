import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ComponentDefinitionRead } from '../../../core/models';
import { ComponentDefinitionStoreService } from '../../../core/services/component-definition-store.service';
import { SelectionService } from '../../../core/services/selection.service';
import { BuilderStateService } from '../builder/builder-state.service';
import { BuilderNode } from '../builder/builder.models';
import {
  findInnermostContainerAt,
  getAbsolutePosition,
  isDescendantOf,
} from '../builder/builder.models';
import { CanvasViewService } from '../builder/canvas-view.service';
import { ComponentRendererComponent } from '../../../shared/renderer/component-renderer.component';
import { DropListRegistryService } from '../builder/drop-list-registry.service';

/** Snap within this many *screen* pixels of a sibling's edge/center — divided
 *  by zoom so the snap feels equally "sticky" at any zoom level. */
const SNAP_THRESHOLD_PX = 8;

@Component({
  selector: 'app-canvas-node',
  standalone: true,
  imports: [
    CdkDropList,
    FormsModule,
    ComponentRendererComponent,
    forwardRef(() => CanvasNodeComponent),
  ],
  templateUrl: './canvas-node.component.html',
  styleUrl: './canvas-node.component.scss',
})
export class CanvasNodeComponent implements OnInit, OnDestroy {
  protected readonly selection = inject(SelectionService);
  protected readonly builderState = inject(BuilderStateService);
  protected readonly definitionStore = inject(ComponentDefinitionStoreService);
  protected readonly dropRegistry = inject(DropListRegistryService);
  protected readonly canvasView = inject(CanvasViewService);

  readonly node = input.required<BuilderNode>();
  readonly parentId = input<string | null>(null);
  readonly isRoot = input(false);

  /** Manual (non-CDK) move-drag — driven straight off node().position via
   *  [style.left.px]/[style.top.px], so it stays correct under the canvas's
   *  CSS zoom transform. Works for both root nodes (positioned on the canvas)
   *  and nested nodes (positioned freely inside their parent container). */
  protected readonly isDragging = signal(false);
  private dragOrigin = { x: 0, y: 0, nodeX: 0, nodeY: 0 };
  private readonly onDragMoveBound = (event: MouseEvent) => this.onDragMove(event);
  private readonly onDragEndBound = () => this.onDragEnd();

  /** Corner-handle resize (drag directly on the canvas), same manual pattern. */
  protected readonly isResizing = signal(false);
  private resizeOrigin = { x: 0, y: 0, w: 0, h: 0 };
  private readonly onResizeMoveBound = (event: MouseEvent) => this.onResizeMove(event);
  private readonly onResizeEndBound = () => this.onResizeEnd();

  /** Inline rename (double-click the component on the canvas, Figma-style). */
  protected readonly editing = signal(false);
  protected draftName = '';
  private readonly renameInput =
    viewChild<ElementRef<HTMLInputElement>>('renameInput');

  protected dropListId(): string {
    return `container-${this.node().id}`;
  }

  ngOnInit(): void {
    if (this.isContainer()) {
      this.dropRegistry.register(this.dropListId());
    }
  }

  ngOnDestroy(): void {
    if (this.isContainer()) {
      this.dropRegistry.unregister(this.dropListId());
    }
    this.detachDragListeners();
    this.detachResizeListeners();
  }

  protected isContainer(): boolean {
    return this.definitionStore.isContainer(this.node().component_type);
  }

  protected onSelect(event: MouseEvent): void {
    event.stopPropagation();
    this.selection.select(this.node().id, { additive: event.shiftKey });
  }

  protected onDelete(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    this.builderState.removeNode(this.node().id);
  }

  // ---- Rename ------------------------------------------------------------

  protected startRename(event: MouseEvent): void {
    event.stopPropagation();
    this.draftName = this.currentName();
    this.editing.set(true);
    setTimeout(() => {
      const el = this.renameInput()?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  protected commitRename(): void {
    if (!this.editing()) {
      return;
    }
    const trimmed = this.draftName.trim();
    if (trimmed) {
      this.builderState.renameNode(this.node().id, trimmed);
    }
    this.editing.set(false);
  }

  protected cancelRename(): void {
    this.editing.set(false);
  }

  private currentName(): string {
    const props = this.node().props;
    const value = props['label'] ?? props['content'];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
    return this.definitionStore.getByType(this.node().component_type)?.label ?? '';
  }

  // ---- Move drag ---------------------------------------------------------

  protected onNodeMouseDown(event: MouseEvent): void {
    if (event.button !== 0 || this.editing()) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest('.resize-handle, .delete-btn, .node-rename')) {
      return;
    }

    const host = (event.currentTarget as HTMLElement).closest('app-canvas-node');
    const hitNode = target.closest('app-canvas-node');
    if (host && hitNode && hitNode !== host) {
      return;
    }

    this.startMoveDrag(event);
  }

  private startMoveDrag(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.selection.select(this.node().id);

    const pos = this.node().position;
    this.dragOrigin = { x: event.clientX, y: event.clientY, nodeX: pos.x, nodeY: pos.y };
    this.isDragging.set(true);

    document.addEventListener('mousemove', this.onDragMoveBound);
    document.addEventListener('mouseup', this.onDragEndBound);
  }

  private onDragMove(event: MouseEvent): void {
    const zoom = this.canvasView.zoom();
    const dx = (event.clientX - this.dragOrigin.x) / zoom;
    const dy = (event.clientY - this.dragOrigin.y) / zoom;
    const pos = this.node().position;

    const rawX = this.dragOrigin.nodeX + dx;
    const rawY = this.dragOrigin.nodeY + dy;

    // Snap + alignment guides only for root nodes, whose coordinates live in
    // the same space as the guide overlay. Nested nodes move freely inside
    // their parent (guides would render in the wrong coordinate space).
    const target = this.isRoot()
      ? this.snapPosition(rawX, rawY, pos.w, pos.h)
      : { x: rawX, y: rawY };

    this.builderState.updateNodePosition(this.node().id, {
      x: Math.max(0, Math.round(target.x)),
      y: Math.max(0, Math.round(target.y)),
    });
  }

  private onDragEnd(): void {
    this.isDragging.set(false);
    this.canvasView.clearSnapGuides();
    this.detachDragListeners();

    if (this.isRoot()) {
      this.tryReparentRootIntoContainer();
    }
  }

  /** When a root node is released over a Section/Card, nest it as a child so
   *  the Layers panel matches what you see on the canvas. */
  private tryReparentRootIntoContainer(): void {
    const node = this.node();
    if (!this.builderState.isRootNode(node.id)) {
      return;
    }

    const center = {
      x: node.position.x + node.position.w / 2,
      y: node.position.y + node.position.h / 2,
    };

    const hit = findInnermostContainerAt(
      this.builderState.nodes(),
      center,
      (type) => this.definitionStore.isContainer(type),
    );
    if (!hit || hit.node.id === node.id) {
      return;
    }
    if (isDescendantOf(this.builderState.nodes(), node.id, hit.node.id)) {
      return;
    }

    const abs = getAbsolutePosition(this.builderState.nodes(), hit.node.id);
    if (!abs) {
      return;
    }

    this.builderState.moveNode(node.id, hit.node.id, hit.node.children.length);
    this.builderState.updateNodePosition(node.id, {
      x: Math.max(0, Math.round(node.position.x - abs.x)),
      y: Math.max(0, Math.round(node.position.y - abs.y)),
    });
  }

  private detachDragListeners(): void {
    document.removeEventListener('mousemove', this.onDragMoveBound);
    document.removeEventListener('mouseup', this.onDragEndBound);
  }

  /** Compares the dragged box's edges/center against every sibling root
   *  node's edges/center and snaps + records guide lines when within
   *  threshold. */
  private snapPosition(
    x: number,
    y: number,
    w: number,
    h: number,
  ): { x: number; y: number } {
    const threshold = SNAP_THRESHOLD_PX / this.canvasView.zoom();
    const siblings = this.builderState.nodes().filter((n) => n.id !== this.node().id);

    const targetsX: number[] = [];
    const targetsY: number[] = [];
    for (const sibling of siblings) {
      const sx = sibling.position.x;
      const sy = sibling.position.y;
      targetsX.push(sx, sx + sibling.position.w, sx + sibling.position.w / 2);
      targetsY.push(sy, sy + sibling.position.h, sy + sibling.position.h / 2);
    }

    const candidatesX = [x, x + w / 2, x + w];
    const candidatesY = [y, y + h / 2, y + h];

    let snappedX = x;
    let bestDx = threshold;
    for (const candidate of candidatesX) {
      for (const target of targetsX) {
        const diff = Math.abs(candidate - target);
        if (diff <= bestDx) {
          bestDx = diff;
          snappedX = x + (target - candidate);
        }
      }
    }
    const vLines: number[] = [];
    if (bestDx < threshold) {
      for (const candidate of [snappedX, snappedX + w / 2, snappedX + w]) {
        if (targetsX.some((t) => Math.abs(candidate - t) < 0.5)) {
          vLines.push(candidate);
        }
      }
    }

    let snappedY = y;
    let bestDy = threshold;
    for (const candidate of candidatesY) {
      for (const target of targetsY) {
        const diff = Math.abs(candidate - target);
        if (diff <= bestDy) {
          bestDy = diff;
          snappedY = y + (target - candidate);
        }
      }
    }
    const hLines: number[] = [];
    if (bestDy < threshold) {
      for (const candidate of [snappedY, snappedY + h / 2, snappedY + h]) {
        if (targetsY.some((t) => Math.abs(candidate - t) < 0.5)) {
          hLines.push(candidate);
        }
      }
    }

    this.canvasView.setSnapGuides(vLines, hLines);
    return { x: snappedX, y: snappedY };
  }

  // ---- Resize drag -------------------------------------------------------

  protected onResizeStart(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();

    this.selection.select(this.node().id);

    const pos = this.node().position;
    this.resizeOrigin = { x: event.clientX, y: event.clientY, w: pos.w, h: pos.h };
    this.isResizing.set(true);

    document.addEventListener('mousemove', this.onResizeMoveBound);
    document.addEventListener('mouseup', this.onResizeEndBound);
  }

  private onResizeMove(event: MouseEvent): void {
    const zoom = this.canvasView.zoom();
    const dx = (event.clientX - this.resizeOrigin.x) / zoom;
    const dy = (event.clientY - this.resizeOrigin.y) / zoom;
    const w = Math.max(40, Math.round(this.resizeOrigin.w + dx));
    const h = Math.max(24, Math.round(this.resizeOrigin.h + dy));
    this.builderState.updateNodePosition(this.node().id, { w, h });
  }

  private onResizeEnd(): void {
    this.isResizing.set(false);
    this.detachResizeListeners();
  }

  private detachResizeListeners(): void {
    document.removeEventListener('mousemove', this.onResizeMoveBound);
    document.removeEventListener('mouseup', this.onResizeEndBound);
  }

  // ---- Palette drop into this container ----------------------------------

  protected onDrop(event: CdkDragDrop<BuilderNode[]>): void {
    // Nested nodes move freely (manual drag), so the only drop we handle is a
    // brand-new component coming from the palette — placed at the drop point.
    if (event.previousContainer.id !== 'palette-list') {
      return;
    }

    const definition = event.item.data as ComponentDefinitionRead;
    const newNode = this.builderState.addNode(
      definition,
      this.node().id,
      this.node().children.length,
    );
    this.builderState.updateNodePosition(newNode.id, this.dropPointInContainer(event));
  }

  private dropPointInContainer(event: CdkDragDrop<BuilderNode[]>): { x: number; y: number } {
    const el = event.container.element.nativeElement;
    const rect = el.getBoundingClientRect();
    const zoom = this.canvasView.zoom();
    return {
      x: Math.max(0, Math.round((event.dropPoint.x - rect.left) / zoom)),
      y: Math.max(0, Math.round((event.dropPoint.y - rect.top) / zoom)),
    };
  }
}
