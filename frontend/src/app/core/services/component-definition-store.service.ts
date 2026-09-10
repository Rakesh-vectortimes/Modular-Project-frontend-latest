import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';

import { ComponentDefinitionGrouped, ComponentDefinitionRead, PropertySchemaField } from '../models';
import { PALETTE_VISIBLE_COMPONENT_TYPES } from '../constants/palette-visible-types';
import { BUILTIN_COMPONENT_DEFINITIONS } from './builtin-component-definitions';
import { ComponentDefinitionService } from './component-definition.service';

@Injectable({ providedIn: 'root' })
export class ComponentDefinitionStoreService {
  private readonly api = inject(ComponentDefinitionService);

  private readonly _grouped = signal<ComponentDefinitionGrouped[]>([]);
  private readonly _loaded = signal(false);
  private readonly _loading = signal(false);

  /** Backend groups merged with client-side built-ins (social login buttons,
   *  link button, …) so the palette shows components whose renderer shapes
   *  exist even when the backend hasn't seeded a definition for them. */
  readonly grouped = computed(() =>
    this.filterPalette(
      this.patchDefinitionsFromBuiltins(this.mergeBuiltins(this._grouped())),
    ),
  );
  readonly loaded = this._loaded.asReadonly();
  readonly loading = this._loading.asReadonly();

  readonly byType = computed(() => {
    const map = new Map<string, ComponentDefinitionRead>();
    for (const group of this.grouped()) {
      for (const def of group.components) {
        map.set(def.type, def);
      }
    }
    return map;
  });

  /**
   * Appends built-in definitions to the backend-provided groups. The backend
   * always wins: a built-in is skipped when the backend already defines a
   * component of the same `type`. Built-ins join the existing category group
   * (matched case-insensitively) or start a new group if none exists.
   */
  private mergeBuiltins(
    backendGroups: ComponentDefinitionGrouped[],
  ): ComponentDefinitionGrouped[] {
    const backendTypes = new Set(
      backendGroups.flatMap((group) => group.components.map((def) => def.type)),
    );

    const merged: ComponentDefinitionGrouped[] = backendGroups.map((group) => ({
      category: group.category,
      components: [...group.components],
    }));

    for (const def of BUILTIN_COMPONENT_DEFINITIONS) {
      if (backendTypes.has(def.type)) {
        continue;
      }
      const group = merged.find(
        (g) => g.category.toLowerCase() === def.category.toLowerCase(),
      );
      if (group) {
        group.components.push(def);
      } else {
        merged.push({ category: def.category, components: [def] });
      }
    }

    return merged;
  }

  /**
   * Backend definitions win for palette entries, but built-in schema patches
   * ensure new property fields/options (e.g. Button appearance "social") appear
   * even before the database is re-seeded.
   */
  private patchDefinitionsFromBuiltins(
    groups: ComponentDefinitionGrouped[],
  ): ComponentDefinitionGrouped[] {
    const builtinByType = new Map(
      BUILTIN_COMPONENT_DEFINITIONS.map((def) => [def.type, def]),
    );

    return groups.map((group) => ({
      category: group.category,
      components: group.components.map((def) => {
        const builtin = builtinByType.get(def.type);
        if (!builtin) {
          return def;
        }
        return this.mergeDefinitionWithBuiltin(def, builtin);
      }),
    }));
  }

  private mergeDefinitionWithBuiltin(
    backend: ComponentDefinitionRead,
    builtin: ComponentDefinitionRead,
  ): ComponentDefinitionRead {
    const backendFields = new Map(backend.property_schema.map((field) => [field.key, field]));
    const mergedSchema: PropertySchemaField[] = [];

    for (const builtinField of builtin.property_schema) {
      const existing = backendFields.get(builtinField.key);
      if (!existing) {
        mergedSchema.push(builtinField);
        continue;
      }

      if (builtinField.options?.length && Array.isArray(existing.options)) {
        mergedSchema.push({
          ...existing,
          options: [...new Set([...existing.options, ...builtinField.options])],
        });
      } else {
        mergedSchema.push(existing);
      }
      backendFields.delete(builtinField.key);
    }

    for (const remaining of backendFields.values()) {
      mergedSchema.push(remaining);
    }

    return {
      ...backend,
      default_props: { ...builtin.default_props, ...backend.default_props },
      property_schema: mergedSchema,
    };
  }

  /** Only generic, configurable components appear in the palette. */
  private filterPalette(groups: ComponentDefinitionGrouped[]): ComponentDefinitionGrouped[] {
    return groups
      .map((group) => ({
        category: group.category,
        components: group.components.filter((def) =>
          PALETTE_VISIBLE_COMPONENT_TYPES.has(def.type),
        ),
      }))
      .filter((group) => group.components.length > 0);
  }

  ensureLoaded(): Observable<ComponentDefinitionGrouped[]> {
    if (this._loaded()) {
      return new Observable((subscriber) => {
        subscriber.next(this._grouped());
        subscriber.complete();
      });
    }

    this._loading.set(true);
    return this.api.listGrouped().pipe(
      tap({
        next: (groups) => {
          this._grouped.set(groups);
          this._loaded.set(true);
          this._loading.set(false);
        },
        error: () => this._loading.set(false),
      }),
    );
  }

  getByType(type: string): ComponentDefinitionRead | undefined {
    return this.byType().get(type);
  }

  isContainer(type: string): boolean {
    return this.byType().get(type)?.is_container ?? false;
  }
}
