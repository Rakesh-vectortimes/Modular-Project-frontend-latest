import { RenderNode } from '../../shared/renderer/render-node.model';

export interface RequiredFieldIssue {
  fieldKey: string;
  label: string;
}

/** Walk the layout tree and collect required inputs that are empty in form values. */
export function findMissingRequiredFields(
  nodes: RenderNode[],
  values: Record<string, unknown>,
): RequiredFieldIssue[] {
  const issues: RequiredFieldIssue[] = [];

  const visit = (items: RenderNode[]): void => {
    for (const node of items) {
      if (isInputNode(node) && isRequired(node.props)) {
        const fieldKey = resolveFieldKey(node);
        if (fieldKey && isEmptyValue(values[fieldKey])) {
          issues.push({
            fieldKey,
            label: String(node.props['label'] || fieldKey).trim() || fieldKey,
          });
        }
      }
      if (node.children?.length) {
        visit(node.children);
      }
    }
  };

  visit(nodes);
  return issues;
}

function isInputNode(node: RenderNode): boolean {
  const type = node.component_type;
  if (type === 'user_input') {
    return true;
  }
  return [
    'text_input',
    'email_input',
    'password_input',
    'number_input',
    'textarea',
    'checkbox',
    'toggle_switch',
    'dropdown',
    'radio_group',
    'date_picker',
    'file_upload',
  ].includes(type);
}

function isRequired(props: Record<string, unknown>): boolean {
  return props['required'] === true || props['required'] === 'true';
}

function resolveFieldKey(node: RenderNode): string {
  const key = String(node.props['fieldKey'] ?? '').trim();
  if (key) {
    return key;
  }
  const label = String(node.props['label'] ?? '').trim();
  if (!label) {
    return '';
  }
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

function isEmptyValue(value: unknown): boolean {
  if (value == null) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  if (Array.isArray(value)) {
    return value.length === 0;
  }
  return false;
}
