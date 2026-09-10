import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
import { Component, inject, OnInit } from '@angular/core';

import { ComponentDefinitionStoreService } from '../../../core/services/component-definition-store.service';
import { DropListRegistryService } from '../builder/drop-list-registry.service';

@Component({
  selector: 'app-builder-palette',
  standalone: true,
  imports: [CdkDrag, CdkDropList],
  templateUrl: './palette.component.html',
  styleUrl: './palette.component.scss',
})
export class PaletteComponent implements OnInit {
  protected readonly definitionStore = inject(ComponentDefinitionStoreService);
  protected readonly dropRegistry = inject(DropListRegistryService);

  /** Palette items are drag-only; this list is never mutated. */
  protected readonly paletteStub: unknown[] = [];

  ngOnInit(): void {
    this.definitionStore.ensureLoaded().subscribe();
  }

  protected iconChar(icon: string): string {
    const map: Record<string, string> = {
      text_fields: 'T',
      notes: '¶',
      pin: '#',
      arrow_drop_down_circle: '▾',
      check_box: '☑',
      radio_button_checked: '◎',
      smart_button: '▣',
      view_agenda: '▭',
      web: '▣',
      title: 'Aa',
      view_kanban: '▥',
    };
    return map[icon] ?? '◆';
  }
}
