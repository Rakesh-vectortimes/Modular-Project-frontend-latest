/**
 * Converts the universal `node.props.style` bucket (see
 * `features/pages/properties-panel/style-schema.ts` for the editable schema)
 * into an [ngStyle]-compatible CSS object. Lives in `shared/renderer` because
 * `ComponentRendererComponent` applies it to every rendered node's host,
 * regardless of component type.
 */
const BOX_SHADOWS: Record<string, string> = {
  sm: '0 1px 2px rgba(0,0,0,0.08)',
  md: '0 4px 10px rgba(0,0,0,0.12)',
  lg: '0 10px 24px rgba(0,0,0,0.18)',
};

export function styleBucketToCss(style: unknown): Record<string, string> {
  if (!style || typeof style !== 'object') {
    return {};
  }
  const s = style as Record<string, unknown>;
  const css: Record<string, string> = {};

  if (typeof s['backgroundColor'] === 'string' && s['backgroundColor']) {
    css['background-color'] = s['backgroundColor'] as string;
  }
  if (typeof s['textColor'] === 'string' && s['textColor']) {
    css['color'] = s['textColor'] as string;
  }
  if (typeof s['borderColor'] === 'string' && s['borderColor']) {
    const width = typeof s['borderWidth'] === 'number' ? s['borderWidth'] : 1;
    css['border'] = `${width}px solid ${s['borderColor']}`;
  }
  if (typeof s['borderRadius'] === 'number') {
    css['border-radius'] = `${s['borderRadius']}px`;
  }
  if (typeof s['opacity'] === 'number') {
    css['opacity'] = String(Math.min(1, Math.max(0, s['opacity'])));
  }
  if (typeof s['boxShadow'] === 'string' && BOX_SHADOWS[s['boxShadow'] as string]) {
    css['box-shadow'] = BOX_SHADOWS[s['boxShadow'] as string];
  }

  return css;
}
