import {
  Component,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ComponentDefinitionStoreService } from '../../../core/services/component-definition-store.service';
import { SelectionService } from '../../../core/services/selection.service';
import { BuilderStateService } from '../builder/builder-state.service';
import { BuilderNode } from '../builder/builder.models';

@Component({
  selector: 'app-layers-tree-node',
  standalone: true,
  imports: [FormsModule, forwardRef(() => LayersTreeNodeComponent)],
  templateUrl: './layers-tree-node.component.html',
  styleUrl: './layers-tree-node.component.scss',
})
export class LayersTreeNodeComponent {
  protected readonly selection = inject(SelectionService);
  protected readonly definitionStore = inject(ComponentDefinitionStoreService);
  protected readonly builderState = inject(BuilderStateService);

  readonly node = input.required<BuilderNode>();
  readonly depth = input(0);

  /** Inline-rename state — set by double-clicking the layer's name. */
  protected readonly editing = signal(false);
  protected draftName = '';
  private readonly renameInput =
    viewChild<ElementRef<HTMLInputElement>>('renameInput');

  protected label(): string {
    const def = this.definitionStore.getByType(this.node().component_type);
    const props = this.node().props;
    const propLabel = props['label'] ?? props['content'];
    if (typeof propLabel === 'string' && propLabel.trim()) {
      return propLabel;
    }
    return def?.label ?? this.node().component_type;
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

  /** Double-click the name to rename it inline (Figma-style). */
  protected startRename(event: MouseEvent): void {
    event.stopPropagation();
    this.draftName = this.label();
    this.editing.set(true);
    // Focus + select after Angular renders the input (next macrotask).
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
}
