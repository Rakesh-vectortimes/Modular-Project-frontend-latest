import { PropertySchemaField } from '../../../core/models';

/**
 * Universal "Actions" field shown for every component, regardless of type.
 * Like `STYLE_PROPERTY_SCHEMA`, this is a frontend-defined schema (not driven
 * by the component's backend `property_schema`) so that ANY placed component —
 * not just Button / Link Button / Social Login Button — can define what happens
 * when it is clicked at runtime: go to another page, submit the form, call a
 * backend API, open a link, and so on.
 *
 * It edits the node's `action` prop, which `RuntimeActionService` reads and
 * executes in Preview/Run and Published apps.
 */
export const ACTION_PROPERTY_SCHEMA: PropertySchemaField[] = [
  { key: 'action', label: 'On click', inputType: 'action', options: null },
];
