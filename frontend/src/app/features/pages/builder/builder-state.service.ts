import { Injectable, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { ComponentDefinitionRead } from '../../../core/models';
import { PageService } from '../../../core/services/page.service';
import { SelectionService } from '../../../core/services/selection.service';
import {
  BuilderNode,
  builderNodeFromRead,
  cloneTree,
  createNodeFromDefinition,
  findNodeById,
  findParentList,
  findParentNode,
  isLayoutRegion,
  nextTempNodeId,
  resetTempNodeIds,
  resyncNodesToViewport,
  socialLoginNodeHeight,
  socialLoginProviderCount,
  isSocialLoginNode,
  snapLayoutRegionPosition,
  toLayoutNodeWrite,
} from './builder.models';
import {
  ARTBOARD_ORIGIN,
  PageSettings,
  normalizePageSettings,
} from '../../../core/models';

@Injectable()
export class BuilderStateService {
  private readonly pageService = inject(PageService);
  private readonly selection = inject(SelectionService);

  readonly pageId = signal<string | null>(null);
  readonly nodes = signal<BuilderNode[]>([]);
  readonly pageSettings = signal<PageSettings>(normalizePageSettings());
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly dirty = signal(false);
  readonly error = signal<string | null>(null);

  load(pageId: string): void {
    this.pageId.set(pageId);
    this.loading.set(true);
    this.error.set(null);
    this.selection.clear();
    this.dirty.set(false);

    this.pageService
      .getLayout(pageId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (layout) => {
          resetTempNodeIds();
          const nodes = layout.components.map(builderNodeFromRead);
          this.normalizeSocialLoginHeights(nodes, false);
          this.nodes.set(nodes);
          this.pageSettings.set(normalizePageSettings(layout.settings));
        },
        error: () => {
          resetTempNodeIds();
          this.nodes.set([]);
          this.pageSettings.set(normalizePageSettings());
          this.error.set('Failed to load page layout.');
        },
      });
  }

  reset(): void {
    this.pageId.set(null);
    this.nodes.set([]);
    this.pageSettings.set(normalizePageSettings());
    this.dirty.set(false);
    this.error.set(null);
    this.selection.clear();
  }

  getNode(id: string): BuilderNode | null {
    return findNodeById(this.nodes(), id);
  }

  isRootNode(nodeId: string): boolean {
    return this.nodes().some((node) => node.id === nodeId);
  }

  addNode(
    definition: ComponentDefinitionRead,
    parentId: string | null,
    index: number,
  ): BuilderNode {
    const newNode = createNodeFromDefinition(definition, index);

    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      if (parentId === null) {
        tree.splice(index, 0, newNode);
        tree.forEach((n, i) => (n.order = i));
        return tree;
      }

      const parent = findNodeById(tree, parentId);
      if (parent) {
        parent.children.splice(index, 0, newNode);
        parent.children.forEach((n, i) => (n.order = i));
      }
      return tree;
    });

    this.dirty.set(true);
    this.selection.select(newNode.id);
    return newNode;
  }

  moveNode(
    nodeId: string,
    targetParentId: string | null,
    index: number,
  ): void {
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      const node = findNodeById(tree, nodeId);
      if (!node) {
        return roots;
      }

      const extracted = this.extractNode(tree, nodeId);
      if (!extracted) {
        return roots;
      }

      if (targetParentId === null) {
        tree.splice(index, 0, extracted);
        tree.forEach((n, i) => (n.order = i));
      } else {
        const parent = findNodeById(tree, targetParentId);
        if (parent) {
          parent.children.splice(index, 0, extracted);
          parent.children.forEach((n, i) => (n.order = i));
        }
      }
      return tree;
    });

    this.dirty.set(true);
  }

  updateNodeProps(nodeId: string, props: Record<string, unknown>): void {
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      const node = findNodeById(tree, nodeId);
      if (node) {
        const prevType = String(node.props['containerType'] ?? '');
        const nextType = String(props['containerType'] ?? '');
        node.props = props;

        if (
          node.component_type === 'container' &&
          nextType !== prevType &&
          isLayoutRegion(nextType)
        ) {
          const parent = findParentNode(tree, nodeId);
          const settings = this.pageSettings();
          const frame = parent
            ? {
                originX: 0,
                originY: 0,
                width: parent.position.w,
                height: parent.position.h,
              }
            : {
                originX: ARTBOARD_ORIGIN.x,
                originY: ARTBOARD_ORIGIN.y,
                width: settings.viewportWidth,
                height: settings.viewportHeight,
              };
          node.position = snapLayoutRegionPosition(nextType, node.position, frame);
        }

        if (isSocialLoginNode(node.component_type, props)) {
          const count = socialLoginProviderCount(props);
          node.position = {
            ...node.position,
            h: socialLoginNodeHeight(count),
          };
        }
      }
      return tree;
    });
    this.dirty.set(true);
  }

  updatePageSettings(patch: Partial<PageSettings>): void {
    const previous = this.pageSettings();
    const next = normalizePageSettings({ ...previous, ...patch });
    const sizeChanged =
      previous.viewportWidth !== next.viewportWidth ||
      previous.viewportHeight !== next.viewportHeight;

    this.pageSettings.set(next);

    if (sizeChanged) {
      this.nodes.update((roots) => {
        const tree = cloneTree(roots);
        resyncNodesToViewport(
          tree,
          {
            originX: ARTBOARD_ORIGIN.x,
            originY: ARTBOARD_ORIGIN.y,
            width: previous.viewportWidth,
            height: previous.viewportHeight,
          },
          {
            originX: ARTBOARD_ORIGIN.x,
            originY: ARTBOARD_ORIGIN.y,
            width: next.viewportWidth,
            height: next.viewportHeight,
          },
        );
        return tree;
      });
    }

    this.dirty.set(true);
  }

  /** Sets a node's display name — writes to whichever prop drives its label
   *  (`label` for most components, `content` for Text/Label), so the rename
   *  shows up both on the canvas and in the Layers panel. */
  renameNode(nodeId: string, name: string): void {
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      const node = findNodeById(tree, nodeId);
      if (node) {
        const key =
          'label' in node.props ? 'label' : 'content' in node.props ? 'content' : 'label';
        node.props = { ...node.props, [key]: name };
      }
      return tree;
    });
    this.dirty.set(true);
  }

  updateNodePosition(nodeId: string, position: Partial<BuilderNode['position']>): void {
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      const node = findNodeById(tree, nodeId);
      if (node) {
        node.position = { ...node.position, ...position };
      }
      return tree;
    });
    this.dirty.set(true);
  }

  notifyTreeChanged(): void {
    this.nodes.update((roots) => cloneTree(roots));
    this.dirty.set(true);
  }

  /** Deletes a node (and its children, if any) from anywhere in the tree. */
  removeNode(nodeId: string): void {
    this.removeNodes([nodeId]);
  }

  /** Deletes several nodes (e.g. a multi-selection) in one tree update. */
  removeNodes(nodeIds: string[]): void {
    if (!nodeIds.length) {
      return;
    }

    let removedAny = false;
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      for (const id of nodeIds) {
        if (this.extractNode(tree, id) !== null) {
          removedAny = true;
        }
      }
      return tree;
    });

    if (!removedAny) {
      return;
    }

    this.selection.clear();
    this.dirty.set(true);
  }

  /** Duplicates each given node (with a fresh id/subtree) — root nodes are
   *  offset slightly so the copy doesn't sit exactly on top of the original;
   *  nested nodes are inserted right after the original in the same parent.
   *  Selects the new copies afterward. */
  duplicateNodes(nodeIds: string[]): void {
    if (!nodeIds.length) {
      return;
    }

    const newIds: string[] = [];
    this.nodes.update((roots) => {
      const tree = cloneTree(roots);
      for (const id of nodeIds) {
        const original = findNodeById(tree, id);
        if (!original) {
          continue;
        }

        const clone = this.cloneWithFreshIds(original);
        const isRoot = tree.some((n) => n.id === id);

        if (isRoot) {
          clone.position = {
            ...clone.position,
            x: clone.position.x + 24,
            y: clone.position.y + 24,
          };
          clone.order = tree.length;
          tree.push(clone);
        } else {
          const parentList = findParentList(tree, id);
          if (!parentList) {
            continue;
          }
          const index = parentList.findIndex((n) => n.id === id);
          parentList.splice(index + 1, 0, clone);
          parentList.forEach((n, i) => (n.order = i));
        }

        newIds.push(clone.id);
      }
      return tree;
    });

    if (newIds.length) {
      this.selection.selectMany(newIds);
      this.dirty.set(true);
    }
  }

  private cloneWithFreshIds(node: BuilderNode): BuilderNode {
    return {
      ...node,
      id: nextTempNodeId(),
      props: structuredClone(node.props),
      position: { ...node.position },
      children: node.children.map((child) => this.cloneWithFreshIds(child)),
    };
  }

  save(): void {
    const pageId = this.pageId();
    if (pageId === null) {
      return;
    }

    this.saving.set(true);
    this.error.set(null);

    const tree = cloneTree(this.nodes());
    this.normalizeSocialLoginHeights(tree, false);

    const payload = {
      components: tree.map(toLayoutNodeWrite),
      settings: this.pageSettings(),
    };

    this.pageService
      .saveLayout(pageId, payload)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: (layout) => {
          resetTempNodeIds();
          const nodes = layout.components.map(builderNodeFromRead);
          this.normalizeSocialLoginHeights(nodes, false);
          this.nodes.set(nodes);
          this.pageSettings.set(normalizePageSettings(layout.settings));
          this.dirty.set(false);
        },
        error: () => this.error.set('Failed to save layout.'),
      });
  }

  private extractNode(nodes: BuilderNode[], id: string): BuilderNode | null {
    const rootIndex = nodes.findIndex((n) => n.id === id);
    if (rootIndex >= 0) {
      return nodes.splice(rootIndex, 1)[0] ?? null;
    }

    for (const node of nodes) {
      const childIndex = node.children.findIndex((c) => c.id === id);
      if (childIndex >= 0) {
        return node.children.splice(childIndex, 1)[0] ?? null;
      }
      const nested = this.extractNode(node.children, id);
      if (nested) {
        return nested;
      }
    }
    return null;
  }

  /** Align stored boxes with compact runtime rendering (publish parity). */
  private normalizeSocialLoginHeights(nodes: BuilderNode[], markDirty = true): void {
    for (const node of nodes) {
      if (isSocialLoginNode(node.component_type, node.props)) {
        const count = socialLoginProviderCount(node.props);
        const expected = socialLoginNodeHeight(count);
        if (node.position.h !== expected) {
          node.position = { ...node.position, h: expected };
          if (markDirty) {
            this.dirty.set(true);
          }
        }
      } else {
        const compactTypes: Record<string, { w?: number; h: number }> = {
          text_input: { h: 62 },
          email_input: { h: 62 },
          password_input: { h: 62 },
          number_input: { h: 62 },
          dropdown: { h: 62 },
          date_picker: { h: 62 },
          button: { h: 40 },
          link_button: { h: 28 },
        };
        const target = compactTypes[node.component_type];
        if (target && node.position.h > target.h) {
          node.position = { ...node.position, h: target.h };
          if (markDirty) {
            this.dirty.set(true);
          }
        }
      }

      if (node.children.length) {
        this.normalizeSocialLoginHeights(node.children, markDirty);
      }
    }
  }
}
