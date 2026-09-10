import { PropertySchemaField } from '../../../core/models';

/**
 * Universal "Appearance" fields shown for every component, regardless of type.
 * These are stored under `node.props.style` (a nested bucket, separate from the
 * component's own `property_schema`-driven fields) and applied generically by
 * `ComponentRendererComponent` (see `shared/renderer/style.util.ts`) to the
 * rendered element's host — so every existing and future component gets
 * background/text/border/opacity styling without each shape component needing
 * to implement it individually.
 */
export const STYLE_PROPERTY_SCHEMA: PropertySchemaField[] = [
  { key: 'backgroundColor', label: 'Background Color', inputType: 'color', options: null },
  { key: 'textColor', label: 'Text Color', inputType: 'color', options: null },
  { key: 'borderColor', label: 'Border Color', inputType: 'color', options: null },
  { key: 'borderWidth', label: 'Border Width (px)', inputType: 'number', options: null },
  { key: 'borderRadius', label: 'Corner Radius (px)', inputType: 'number', options: null },
  { key: 'opacity', label: 'Opacity (0–1)', inputType: 'number', options: null },
  {
    key: 'boxShadow',
    label: 'Shadow',
    inputType: 'select',
    options: ['none', 'sm', 'md', 'lg'],
  },
];
