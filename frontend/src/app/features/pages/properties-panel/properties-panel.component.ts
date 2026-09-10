import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { ComponentDefinitionStoreService } from '../../../core/services/component-definition-store.service';
import { visiblePropertyKeys } from '../../../core/constants/generic-field-visibility';
import { SelectedPageService } from '../../../core/services/selected-page.service';
import { SelectionService } from '../../../core/services/selection.service';
import { SoftwarePagesStoreService } from '../../../core/services/software-pages-store.service';
import { UploadService } from '../../../core/services/upload.service';
import {
  PageDataSchemaRead,
  PageDataService,
} from '../../../core/services/page-data.service';
import { BuilderStateService } from '../builder/builder-state.service';
import { ACTION_PROPERTY_SCHEMA } from './action-schema';
import { DynamicPropertiesPanelComponent } from './dynamic-properties-panel.component';
import { NodePositionPanelComponent } from './node-position-panel.component';
import { STYLE_PROPERTY_SCHEMA } from './style-schema';

@Component({
  selector: 'app-builder-properties-panel',
  standalone: true,
  imports: [DynamicPropertiesPanelComponent, NodePositionPanelComponent, FormsModule],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss',
})
export class PropertiesPanelComponent {
  private readonly selection = inject(SelectionService);
  private readonly builderState = inject(BuilderStateService);
  private readonly definitionStore = inject(ComponentDefinitionStoreService);
  private readonly uploadService = inject(UploadService);
  private readonly selectedPage = inject(SelectedPageService);
  private readonly pagesStore = inject(SoftwarePagesStoreService);
  private readonly pageData = inject(PageDataService);

  protected readonly styleSchema = STYLE_PROPERTY_SCHEMA;
  protected readonly actionSchema = ACTION_PROPERTY_SCHEMA;
  protected readonly pageSettings = this.builderState.pageSettings;
  protected readonly bgUploading = signal(false);
  protected readonly bgUploadError = signal<string | null>(null);
  protected readonly dataSchema = signal<PageDataSchemaRead | null>(null);
  protected readonly dataSchemaLoading = signal(false);
  protected pageNameDraft = '';
  protected entityNameDraft = '';

  constructor() {
    effect(() => {
      const page = this.selectedPage.selected();
      if (page?.name) {
        this.pageNameDraft = page.name;
      }
      this.entityNameDraft = (page?.entity_name ?? '').toString();
    });

    effect(() => {
      const pageId = this.selectedPage.selected()?.id;
      // Re-fetch after saves so field list stays in sync with layout.
      const dirty = this.builderState.dirty();
      if (!pageId) {
        this.dataSchema.set(null);
        return;
      }
      if (dirty) {
        return;
      }
      this.refreshDataSchema(pageId);
    });
  }

  private refreshDataSchema(pageId: string): void {
    this.dataSchemaLoading.set(true);
    this.pageData.getSchema(pageId).subscribe({
      next: (schema) => {
        this.dataSchema.set(schema);
        this.dataSchemaLoading.set(false);
      },
      error: () => {
        this.dataSchema.set(null);
        this.dataSchemaLoading.set(false);
      },
    });
  }

  protected readonly selectedNode = computed(() => {
    const id = this.selection.selectedNodeId();
    return id != null ? this.builderState.getNode(id) : null;
  });

  protected readonly isMultiSelect = computed(() => this.selection.selectionCount() > 1);
  protected readonly selectionCount = this.selection.selectionCount;

  protected readonly propertySchema = computed(() => {
    const node = this.selectedNode();
    if (!node) {
      return [];
    }
    const schema = this.definitionStore.getByType(node.component_type)?.property_schema ?? [];
    // Action editing now lives in the universal "Actions" section below, which
    // is shown for every component. Strip any `action` field a component's
    // backend definition still declares (Button, Link Button, Social Login
    // Button) so it isn't rendered twice.
    // Also upgrade legacy text/url image fields so Image / Logo always shows Upload.
    let fields = schema
      .filter((field) => field.inputType !== 'action')
      .map((field) => {
        if (this.isImagePropertyField(field) && field.inputType !== 'image') {
          return { ...field, inputType: 'image' };
        }
        if (field.key === 'fieldKey' && field.inputType === 'text') {
          return { ...field, inputType: 'field_key' };
        }
        return field;
      });

    const visible = visiblePropertyKeys(node.component_type, node.props ?? {});
    if (visible) {
      fields = fields.filter((field) => visible.has(field.key));
    }

    return fields;
  });

  /** True for logo/src/background image props (incl. older seeded "text" URL fields). */
  private isImagePropertyField(field: { key: string; label: string; inputType: string }): boolean {
    if (field.inputType === 'image') {
      return true;
    }
    const key = field.key.toLowerCase();
    if (key === 'src' || key === 'backgroundimage' || /image(url)?$/.test(key)) {
      return true;
    }
    const label = field.label.toLowerCase();
    return (
      (field.inputType === 'text' || field.inputType === 'url') &&
      (label.includes('logo') || label.includes('image')) &&
      (label.includes('url') || key.includes('url'))
    );
  }

  protected readonly styleProps = computed(() => {
    const node = this.selectedNode();
    const style = node?.props?.['style'];
    return style && typeof style === 'object' ? (style as Record<string, unknown>) : {};
  });

  /** Every input's `fieldKey` on the current page — the variables a formula
   *  binding can reference. Recomputes as the layout changes. */
  protected readonly availableVariables = computed(() => {
    const keys = new Set<string>();
    const walk = (nodes: ReturnType<typeof this.builderState.nodes>): void => {
      for (const node of nodes) {
        const fieldKey = node.props?.['fieldKey'];
        if (typeof fieldKey === 'string' && fieldKey.trim()) {
          keys.add(fieldKey.trim());
        }
        if (node.children?.length) {
          walk(node.children);
        }
      }
    };
    walk(this.builderState.nodes());
    return Array.from(keys);
  });

  protected onPropsChange(props: Record<string, unknown>): void {
    const node = this.selectedNode();
    if (node) {
      this.builderState.updateNodeProps(node.id, props);
    }
  }

  protected onStyleChange(style: Record<string, unknown>): void {
    const node = this.selectedNode();
    if (node) {
      this.builderState.updateNodeProps(node.id, { ...node.props, style });
    }
  }

  protected onPositionChange(position: {
    x: number;
    y: number;
    w: number;
    h: number;
    rotation: number;
  }): void {
    const node = this.selectedNode();
    if (node) {
      this.builderState.updateNodePosition(node.id, position);
    }
  }

  protected onPageBackgroundColor(value: string): void {
    this.builderState.updatePageSettings({ backgroundColor: value });
  }

  protected onPageBackgroundImage(value: string): void {
    this.builderState.updatePageSettings({ backgroundImage: value.trim() });
  }

  protected clearPageBackgroundImage(): void {
    this.builderState.updatePageSettings({ backgroundImage: '' });
    this.bgUploadError.set(null);
  }

  protected onPageBackgroundFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.bgUploadError.set('Please choose an image file.');
      return;
    }
    this.bgUploadError.set(null);
    this.bgUploading.set(true);
    this.uploadService.uploadImage(file).subscribe({
      next: (url) => {
        this.builderState.updatePageSettings({ backgroundImage: url });
        this.bgUploading.set(false);
      },
      error: (err: Error) => {
        this.bgUploading.set(false);
        this.bgUploadError.set(err?.message || 'Upload failed. Check that the backend is running.');
      },
    });
  }

  protected onViewportWidth(value: string | number): void {
    this.builderState.updatePageSettings({ viewportWidth: Number(value) });
  }

  protected onViewportHeight(value: string | number): void {
    this.builderState.updatePageSettings({ viewportHeight: Number(value) });
  }

  protected applyPreset(width: number, height: number): void {
    this.builderState.updatePageSettings({
      viewportWidth: width,
      viewportHeight: height,
    });
  }

  protected commitPageName(): void {
    const page = this.selectedPage.selected();
    const trimmed = this.pageNameDraft.trim();
    if (!page || !trimmed || trimmed === page.name) {
      this.pageNameDraft = page?.name ?? this.pageNameDraft;
      return;
    }

    this.pagesStore.rename(page.id, trimmed).subscribe({
      next: (updated) => {
        this.pageNameDraft = updated.name;
        this.selectedPage.patchSelected({ name: updated.name });
      },
      error: () => {
        this.pageNameDraft = page.name;
        alert('Failed to rename page.');
      },
    });
  }

  protected commitEntityName(): void {
    const page = this.selectedPage.selected();
    if (!page) {
      return;
    }
    const trimmed = this.entityNameDraft.trim();
    const current = (page.entity_name ?? '').toString();
    if (trimmed === current) {
      return;
    }

    this.pagesStore.setEntityName(page.id, trimmed).subscribe({
      next: (updated) => {
        this.entityNameDraft = (updated.entity_name ?? '').toString();
        this.selectedPage.patchSelected({ entity_name: updated.entity_name ?? null });
        // The bound table changed — refresh the shown schema.
        this.refreshDataSchema(page.id);
      },
      error: () => {
        this.entityNameDraft = current;
        alert('Failed to update the page entity.');
      },
    });
  }

  protected duplicateSelection(): void {
    this.builderState.duplicateNodes(this.selection.selectedIds());
  }

  protected deleteSelection(): void {
    this.builderState.removeNodes(this.selection.selectedIds());
  }
}
