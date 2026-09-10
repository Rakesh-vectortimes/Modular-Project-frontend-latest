/**
 * Matches backend app.schemas.layout (LayoutNode*).
 * PageComponentNode is the frontend name for a layout tree node.
 */

export interface PositionSchema {
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
}

export interface LayoutNodeBase {
  component_type: string;
  props: Record<string, unknown>;
  position: PositionSchema;
  order: number;
}

export interface LayoutNodeWrite extends LayoutNodeBase {
  id: string | null;
  children: LayoutNodeWrite[];
}

export interface LayoutNodeRead extends LayoutNodeBase {
  id: string;
  children: LayoutNodeRead[];
}

/** Semantic alias for LayoutNodeRead used in the page builder. */
export type PageComponentNode = LayoutNodeRead;

/** Semantic alias for LayoutNodeWrite used when saving layouts. */
export type PageComponentNodeWrite = LayoutNodeWrite;

/** Top-left of the Figma-style page frame on the builder canvas. */
export const ARTBOARD_ORIGIN = { x: 64, y: 64 } as const;

export interface PageSettings {
  backgroundColor: string;
  backgroundImage: string;
  /** Designed page width (like a Figma frame). Published view fills the browser with this. */
  viewportWidth: number;
  /** Designed page height (like a Figma frame). */
  viewportHeight: number;
}

export const DEFAULT_PAGE_SETTINGS: PageSettings = {
  backgroundColor: '#f4f6f9',
  backgroundImage: '',
  viewportWidth: 1280,
  viewportHeight: 800,
};

export function normalizePageSettings(
  partial?: Partial<PageSettings> | null,
): PageSettings {
  const merged = { ...DEFAULT_PAGE_SETTINGS, ...(partial ?? {}) };
  const color = merged.backgroundColor?.trim();
  return {
    backgroundColor: /^#[0-9a-fA-F]{3,8}$/.test(color) ? color : DEFAULT_PAGE_SETTINGS.backgroundColor,
    backgroundImage: (merged.backgroundImage ?? '').trim(),
    viewportWidth: Math.max(320, Math.min(3840, Number(merged.viewportWidth) || 1280)),
    viewportHeight: Math.max(240, Math.min(2160, Number(merged.viewportHeight) || 800)),
  };
}

export interface PageLayoutRead {
  page_id: string;
  components: LayoutNodeRead[];
  settings?: PageSettings;
}

export interface PageLayoutWrite {
  components: LayoutNodeWrite[];
  settings?: PageSettings;
}

export interface PublishedLayoutRead {
  software_id: string;
  page_id: string;
  page_name: string;
  components: LayoutNodeRead[];
  settings?: PageSettings;
}
