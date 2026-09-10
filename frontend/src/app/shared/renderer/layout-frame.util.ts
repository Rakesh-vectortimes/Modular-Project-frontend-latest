import { ARTBOARD_ORIGIN, PageSettings, normalizePageSettings } from '../../core/models';
import { RenderNode } from './render-node.model';

export interface FramedLayout {
  /** Root nodes positioned relative to the page artboard (0,0). */
  nodes: RenderNode[];
  width: number;
  height: number;
}

/**
 * Maps builder canvas coordinates onto the designed page frame so Publish
 * shows the full screen page (Figma frame → browser viewport).
 *
 * Prefer a root `page` component when present — that is the designed website page.
 * Otherwise use page settings size, and stretch a single root container
 * (Section/Card) to fill the frame so "full page section" designs publish full-screen.
 */
export function frameLayoutToArtboard(
  nodes: RenderNode[],
  settings?: Partial<PageSettings> | null,
): FramedLayout {
  const pageRoots = nodes.filter((n) => n.component_type === 'page');
  if (pageRoots.length > 0) {
    const page = pageRoots[0];
    return {
      nodes: [
        {
          ...page,
          position: { ...page.position, x: 0, y: 0 },
        },
      ],
      width: Math.max(320, page.position.w),
      height: Math.max(240, page.position.h),
    };
  }

  const pageSettings = normalizePageSettings(settings);
  const width = pageSettings.viewportWidth;
  const height = pageSettings.viewportHeight;

  let framed = nodes.map((node) => ({
    ...node,
    position: {
      ...node.position,
      x: node.position.x - ARTBOARD_ORIGIN.x,
      y: node.position.y - ARTBOARD_ORIGIN.y,
    },
  }));

  // One root Section/Card meant as the full-page surface → fill the frame.
  const FULL_PAGE_TYPES = new Set(['section', 'card', 'row']);
  if (framed.length === 1 && FULL_PAGE_TYPES.has(framed[0].component_type)) {
    const root = framed[0];
    framed = [
      {
        ...root,
        position: {
          ...root.position,
          x: 0,
          y: 0,
          w: width,
          h: height,
        },
      },
    ];
  }

  return { nodes: framed, width, height };
}

/** @deprecated Prefer frameLayoutToArtboard for publish/preview. */
export function frameLayoutToOrigin(nodes: RenderNode[]): FramedLayout {
  if (!nodes.length) {
    return { nodes: [], width: 0, height: 0 };
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const { x, y, w, h } = node.position;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  }

  return {
    nodes: nodes.map((node) => ({
      ...node,
      position: {
        ...node.position,
        x: node.position.x - minX,
        y: node.position.y - minY,
      },
    })),
    width: Math.max(0, maxX - minX),
    height: Math.max(0, maxY - minY),
  };
}
