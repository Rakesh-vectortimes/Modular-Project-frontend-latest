/** Only these appear in the Components palette — everything else is configured via Properties. */
export const PALETTE_VISIBLE_COMPONENT_TYPES = new Set([
  'user_input',
  'button',
  'text_block',
  'media',
  'container',
  'display',
  'widget',
]);

export function isPaletteVisibleComponentType(type: string): boolean {
  return PALETTE_VISIBLE_COMPONENT_TYPES.has(type);
}
