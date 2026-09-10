import { RenderNode } from './render-node.model';

/** Build a legacy node so generic shapes can reuse existing renderers. */
export function delegateNode(
  node: RenderNode,
  legacyType: string,
  propsOverride: Record<string, unknown> = {},
): RenderNode {
  return {
    ...node,
    component_type: legacyType,
    props: { ...node.props, ...propsOverride },
  };
}

export function variantProp(node: RenderNode, key: string, fallback = ''): string {
  const value = node.props[key];
  return typeof value === 'string' ? value : fallback;
}
