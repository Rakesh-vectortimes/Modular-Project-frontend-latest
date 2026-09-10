import { PositionSchema } from '../../core/models/page-component-node.model';

/** Tree node consumed by the shared component renderer (builder + publish). */
export interface RenderNode {
  id: string;
  component_type: string;
  props: Record<string, unknown>;
  position: PositionSchema;
  order: number;
  children: RenderNode[];
}

export function isPersistedNodeId(id: string): boolean {
  return !id.startsWith('new:');
}

export function stringProp(
  props: Record<string, unknown>,
  key: string,
  fallback = '',
): string {
  const value = props[key];
  return typeof value === 'string' ? value : fallback;
}

export function numberProp(
  props: Record<string, unknown>,
  key: string,
  fallback: number,
): number {
  const value = props[key];
  return typeof value === 'number' ? value : fallback;
}

export function booleanProp(props: Record<string, unknown>, key: string): boolean {
  return !!props[key];
}

export function listProp(props: Record<string, unknown>, key: string): string[] {
  const value = props[key];
  return Array.isArray(value) ? value.map(String) : [];
}
