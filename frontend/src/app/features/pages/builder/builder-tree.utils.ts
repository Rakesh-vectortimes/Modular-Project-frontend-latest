import {
  ARTBOARD_ORIGIN,
  ComponentDefinitionRead,
  LayoutNodeRead,
  LayoutNodeWrite,
  PositionSchema,
} from '../../../core/models';
import { RenderNode, isPersistedNodeId } from '../../../shared/renderer/render-node.model';

/** Default strip height when snapping a header/footer from a non-bar size. */
const LAYOUT_BAR_HEIGHT = 64;
/** Default width when snapping a sidebar from a non-column size. */
const LAYOUT_SIDEBAR_WIDTH = 240;

export type LayoutRegion = 'header' | 'footer' | 'sidebar';

export function isLayoutRegion(value: string): value is LayoutRegion {
  return value === 'header' || value === 'footer' || value === 'sidebar';
}

export interface LayoutFrame {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

/**
 * Snap a container into a page region. Keeps a bar/column-like size when the
 * current box already looks like one; otherwise applies sensible defaults.
 * Position remains fully editable afterward.
 */
export function snapLayoutRegionPosition(
  region: LayoutRegion,
  current: PositionSchema,
  frame: LayoutFrame,
): PositionSchema {
  const maxW = Math.max(40, frame.width);
  const maxH = Math.max(40, frame.height);

  switch (region) {
    case 'header': {
      const looksLikeBar = current.w >= current.h * 2;
      const h = Math.min(maxH, looksLikeBar ? Math.max(32, current.h) : LAYOUT_BAR_HEIGHT);
      return {
        x: frame.originX,
        y: frame.originY,
        w: maxW,
        h,
        rotation: current.rotation ?? 0,
      };
    }
    case 'footer': {
      const looksLikeBar = current.w >= current.h * 2;
      const h = Math.min(maxH, looksLikeBar ? Math.max(32, current.h) : LAYOUT_BAR_HEIGHT);
      return {
        x: frame.originX,
        y: frame.originY + maxH - h,
        w: maxW,
        h,
        rotation: current.rotation ?? 0,
      };
    }
    case 'sidebar': {
      const looksLikeColumn = current.h >= current.w * 2;
      const preferred = looksLikeColumn ? Math.max(40, current.w) : LAYOUT_SIDEBAR_WIDTH;
      const narrowCap = Math.max(96, Math.round(maxW * 0.4));
      const w = Math.min(preferred, maxW, narrowCap);
      return {
        x: frame.originX,
        y: frame.originY,
        w,
        h: maxH,
        rotation: current.rotation ?? 0,
      };
    }
  }
}

function containerTypeOf(node: RenderNode): string {
  return String(node.props?.['containerType'] ?? '').toLowerCase();
}

function isPageFrameNode(node: RenderNode): boolean {
  return node.component_type === 'page' || containerTypeOf(node) === 'page';
}

/** Move a free-placed box to the same relative spot inside a resized frame. */
function mapPositionToFrame(
  pos: PositionSchema,
  from: LayoutFrame,
  to: LayoutFrame,
): PositionSchema {
  const fromW = Math.max(1, from.width);
  const fromH = Math.max(1, from.height);
  const relX = (pos.x - from.originX) / fromW;
  const relY = (pos.y - from.originY) / fromH;
  const w = Math.max(20, Math.min(to.width, Math.round(pos.w * (to.width / fromW))));
  const h = Math.max(20, Math.min(to.height, Math.round(pos.h * (to.height / fromH))));
  const x = Math.round(to.originX + relX * to.width);
  const y = Math.round(to.originY + relY * to.height);
  return {
    x: Math.min(Math.max(to.originX, x), to.originX + to.width - w),
    y: Math.min(Math.max(to.originY, y), to.originY + to.height - h),
    w,
    h,
    rotation: pos.rotation ?? 0,
  };
}

/**
 * After Desktop/Tablet/Mobile (or manual page size) changes, keep layout
 * regions pinned to edges and remap other nodes into the new page frame.
 */
export function resyncNodesToViewport(
  nodes: RenderNode[],
  from: LayoutFrame,
  to: LayoutFrame,
): void {
  if (from.width === to.width && from.height === to.height) {
    return;
  }

  const walk = (
    list: RenderNode[],
    oldFrame: LayoutFrame,
    newFrame: LayoutFrame,
    isRoot: boolean,
  ): void => {
    for (const node of list) {
      const region = containerTypeOf(node);
      const before = { ...node.position };

      if (isRoot && isPageFrameNode(node)) {
        node.position = {
          ...node.position,
          x: to.originX,
          y: to.originY,
          w: to.width,
          h: to.height,
        };
      } else if (isLayoutRegion(region)) {
        node.position = snapLayoutRegionPosition(region, node.position, newFrame);
      } else {
        node.position = mapPositionToFrame(node.position, oldFrame, newFrame);
      }

      if (node.children.length) {
        walk(
          node.children,
          { originX: 0, originY: 0, width: before.w, height: before.h },
          { originX: 0, originY: 0, width: node.position.w, height: node.position.h },
          false,
        );
      }
    }
  };

  walk(nodes, from, to, true);
}

/** Parent node that owns `id`, or null when `id` is a canvas root. */
export function findParentNode(nodes: RenderNode[], id: string): RenderNode | null {
  for (const node of nodes) {
    if (node.children.some((child) => child.id === id)) {
      return node;
    }
    const nested = findParentNode(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

let tempIdCounter = 0;

export function nextTempNodeId(): string {
  tempIdCounter += 1;
  return `new:${tempIdCounter}`;
}

export function resetTempNodeIds(): void {
  tempIdCounter = 0;
}

export function builderNodeFromRead(node: LayoutNodeRead): RenderNode {
  return {
    id: node.id,
    component_type: node.component_type,
    props: structuredClone(node.props),
    position: { ...node.position },
    order: node.order,
    children: node.children.map(builderNodeFromRead),
  };
}

/**
 * Compact, sensible default footprints per component type so newly-dropped
 * components don't all inflate to the same oversized box. Falls back to
 * container/non-container defaults for any type not listed here.
 */
const DEFAULT_SIZES: Record<string, { w: number; h: number }> = {
  // Basic Fields — label (~17) + gap (4) + input (40) + chrome
  text_input: { w: 280, h: 62 },
  user_input: { w: 280, h: 62 },
  text_block: { w: 280, h: 36 },
  media: { w: 140, h: 48 },
  container: { w: 380, h: 460 },
  display: { w: 100, h: 28 },
  widget: { w: 480, h: 220 },
  textarea: { w: 280, h: 120 },
  number_input: { w: 200, h: 62 },
  dropdown: { w: 280, h: 62 },
  checkbox: { w: 200, h: 32 },
  radio_group: { w: 280, h: 96 },
  email_input: { w: 280, h: 62 },
  password_input: { w: 280, h: 62 },
  date_picker: { w: 280, h: 62 },
  toggle_switch: { w: 180, h: 32 },
  file_upload: { w: 280, h: 96 },

  // Actions — single social provider = one 40px button
  button: { w: 280, h: 40 },
  link_button: { w: 160, h: 28 },
  social_login_button: { w: 280, h: 40 },

  // Layout — full website page frame (Figma-style)
  page: { w: 1280, h: 800 },
  section: { w: 380, h: 460 },
  heading: { w: 280, h: 36 },
  text: { w: 240, h: 28 },
  row: { w: 360, h: 100 },
  card: { w: 320, h: 200 },
  divider: { w: 280, h: 12 },
  spacer: { w: 100, h: 24 },
  navbar: { w: 480, h: 56 },
  tabs: { w: 360, h: 160 },
  breadcrumb: { w: 320, h: 28 },
  stepper: { w: 400, h: 72 },
  accordion: { w: 320, h: 140 },

  // Branding — logo-sized by default
  image: { w: 140, h: 48 },
  avatar: { w: 64, h: 64 },
  video_embed: { w: 360, h: 200 },
  icon: { w: 40, h: 40 },

  // Display
  badge: { w: 100, h: 28 },
  list: { w: 280, h: 160 },
  data_table: { w: 480, h: 220 },
  progress_bar: { w: 280, h: 32 },
  rating: { w: 160, h: 32 },

  // Advanced
  kanban_board: { w: 480, h: 320 },
};

/** Height for social login stacks (legacy type or Button with appearance=social). */
export function socialLoginNodeHeight(providerCount: number): number {
  const count = Math.max(1, providerCount);
  const buttonH = 40;
  const gap = 8;
  return count * buttonH + (count - 1) * gap;
}

export function socialLoginProviderCount(props: Record<string, unknown>): number {
  const raw = props['providers'];
  const count = Array.isArray(raw) ? raw.length : 1;
  return count || 1;
}

export function isSocialLoginNode(componentType: string, props: Record<string, unknown>): boolean {
  return (
    componentType === 'social_login_button' ||
    (componentType === 'button' && props['appearance'] === 'social')
  );
}

export function createNodeFromDefinition(
  definition: ComponentDefinitionRead,
  order: number,
): RenderNode {
  const isContainer = definition.is_container;
  let size =
    DEFAULT_SIZES[definition.type] ??
    (isContainer ? { w: 360, h: 200 } : { w: 280, h: 80 });

  if (isSocialLoginNode(definition.type, definition.default_props ?? {})) {
    const count = socialLoginProviderCount(definition.default_props ?? {});
    size = { ...size, h: socialLoginNodeHeight(count) };
  }

  if (definition.type === 'container' && definition.default_props?.['containerType'] === 'page') {
    size = DEFAULT_SIZES['page'] ?? size;
  }

  const isPageFrame =
    definition.type === 'page' ||
    (definition.type === 'container' && definition.default_props?.['containerType'] === 'page');

  const origin = isPageFrame
    ? { x: ARTBOARD_ORIGIN.x, y: ARTBOARD_ORIGIN.y }
    : { x: 24, y: 24 };

  return {
    id: nextTempNodeId(),
    component_type: definition.type,
    props: structuredClone(definition.default_props),
    position: {
      x: origin.x,
      y: origin.y,
      w: size.w,
      h: size.h,
      rotation: 0,
    },
    order,
    children: [],
  };
}

export function toLayoutNodeWrite(node: RenderNode): LayoutNodeWrite {
  return {
    id: isPersistedNodeId(node.id) ? node.id : null,
    component_type: node.component_type,
    props: node.props,
    position: { ...node.position },
    order: node.order,
    children: node.children.map(toLayoutNodeWrite),
  };
}

export function findNodeById(nodes: RenderNode[], id: string): RenderNode | null {
  for (const node of nodes) {
    if (node.id === id) {
      return node;
    }
    const found = findNodeById(node.children, id);
    if (found) {
      return found;
    }
  }
  return null;
}

export function findParentList(nodes: RenderNode[], id: string): RenderNode[] | null {
  for (const node of nodes) {
    if (node.children.some((c) => c.id === id)) {
      return node.children;
    }
    const nested = findParentList(node.children, id);
    if (nested) {
      return nested;
    }
  }
  return null;
}

export function cloneTree(nodes: RenderNode[]): RenderNode[] {
  return nodes.map((node) => ({
    ...node,
    props: structuredClone(node.props),
    position: { ...node.position },
    children: cloneTree(node.children),
  }));
}

export interface ContainerHit {
  node: RenderNode;
  absX: number;
  absY: number;
  localX: number;
  localY: number;
}

/** Absolute top-left of a node in canvas space (sums parent offsets). */
export function getAbsolutePosition(
  nodes: RenderNode[],
  targetId: string,
  offsetX = 0,
  offsetY = 0,
): { x: number; y: number } | null {
  for (const node of nodes) {
    const x = offsetX + node.position.x;
    const y = offsetY + node.position.y;
    if (node.id === targetId) {
      return { x, y };
    }
    const nested = getAbsolutePosition(node.children, targetId, x, y);
    if (nested) {
      return nested;
    }
  }
  return null;
}

/** True when `maybeDescendantId` lives anywhere under `ancestorId`. */
export function isDescendantOf(
  nodes: RenderNode[],
  ancestorId: string,
  maybeDescendantId: string,
): boolean {
  const ancestor = findNodeById(nodes, ancestorId);
  if (!ancestor) {
    return false;
  }
  return findNodeById(ancestor.children, maybeDescendantId) !== null;
}

/** Finds the deepest container whose bounds contain `point` (canvas coordinates).
 *  When sibling containers overlap, later siblings win (paint order). */
export function findInnermostContainerAt(
  nodes: RenderNode[],
  point: { x: number; y: number },
  isContainer: (type: string) => boolean,
  offsetX = 0,
  offsetY = 0,
): ContainerHit | null {
  for (let i = nodes.length - 1; i >= 0; i--) {
    const node = nodes[i];
    if (!isContainer(node.component_type)) {
      continue;
    }

    const absX = offsetX + node.position.x;
    const absY = offsetY + node.position.y;
    const { w, h } = node.position;

    if (
      point.x < absX ||
      point.x > absX + w ||
      point.y < absY ||
      point.y > absY + h
    ) {
      continue;
    }

    const nested = findInnermostContainerAt(
      node.children,
      point,
      isContainer,
      absX,
      absY,
    );
    if (nested) {
      return nested;
    }

    return {
      node,
      absX,
      absY,
      localX: point.x - absX,
      localY: point.y - absY,
    };
  }

  return null;
}
