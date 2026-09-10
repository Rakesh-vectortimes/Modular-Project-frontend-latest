/**
 * Optional shortcuts only for auth pages (Sign up / Log in).
 * All other apps use free-typed database keys — no app-specific preset lists.
 */

export interface FieldKeyPreset {
  key: string;
  label: string;
  hint?: string;
}

/** Keys the backend Sign up / Log in actions specially recognize. */
export const AUTH_FIELD_KEY_PRESETS: FieldKeyPreset[] = [
  { key: 'email', label: 'Email', hint: 'Used for login & account' },
  { key: 'password', label: 'Password', hint: 'Hashed — never stored in form data' },
  { key: 'name', label: 'Full name', hint: 'Single name field' },
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'phone', label: 'Phone' },
];

export const AUTH_FIELD_KEYS = new Set(AUTH_FIELD_KEY_PRESETS.map((p) => p.key).concat(['mobile']));

/** Turn a human label into a stable DB column key, e.g. "Asset Name" → "asset_name". */
export function slugifyFieldKey(label: string): string {
  const slug = label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
  return slug || 'field';
}
