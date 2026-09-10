import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { PageRead, PropertySchemaField } from '../../../core/models';
import {
  AUTH_FIELD_KEYS,
  AUTH_FIELD_KEY_PRESETS,
  slugifyFieldKey,
} from '../../../core/constants/field-key-presets';
import { SelectedSoftwareService } from '../../../core/services/selected-software.service';
import { SoftwarePagesStoreService } from '../../../core/services/software-pages-store.service';
import { UploadService } from '../../../core/services/upload.service';

@Component({
  selector: 'app-dynamic-properties-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './dynamic-properties-panel.component.html',
  styleUrl: './dynamic-properties-panel.component.scss',
})
export class DynamicPropertiesPanelComponent {
  private readonly pagesStore = inject(SoftwarePagesStoreService);
  private readonly selectedSoftware = inject(SelectedSoftwareService);
  private readonly uploadService = inject(UploadService);

  readonly schema = input.required<PropertySchemaField[]>();
  readonly props = input.required<Record<string, unknown>>();
  /** Variable names (input fieldKeys) available on the current page — shown as
   *  clickable chips by the `formula` editor so users know what they can bind to. */
  readonly variables = input<string[]>([]);
  readonly propsChange = output<Record<string, unknown>>();

  /** Pages in the current software — used by `page_select` and `action` (navigate) editors. */
  protected readonly uploadingKey = signal<string | null>(null);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly authFieldKeyPresets = AUTH_FIELD_KEY_PRESETS;

  constructor() {
    effect(() => {
      const software = this.selectedSoftware.selected();
      if (software) {
        this.pagesStore.load(software.id);
      }
    });
  }

  protected getProp(key: string): unknown {
    return this.props()[key];
  }

  protected setProp(key: string, value: unknown): void {
    const next = { ...this.props(), [key]: value };
    if (key === 'inputType' && typeof value === 'string') {
      this.applyUserInputTypeDefaults(next, value);
    }
    if (key === 'label' && typeof value === 'string') {
      this.syncFieldKeyFromLabel(next, value);
    }
    if (key === 'textType' && typeof value === 'string') {
      this.applyTextTypeDefaults(next, value);
    }
    if (key === 'mediaType' && typeof value === 'string') {
      this.applyMediaTypeDefaults(next, value);
    }
    if (key === 'containerType' && typeof value === 'string') {
      this.applyContainerTypeDefaults(next, value);
    }
    if (key === 'displayType' && typeof value === 'string') {
      this.applyDisplayTypeDefaults(next, value);
    }
    if (key === 'widgetType' && typeof value === 'string') {
      this.applyWidgetTypeDefaults(next, value);
    }
    if (key === 'appearance' && typeof value === 'string') {
      this.applyButtonAppearanceDefaults(next, value);
    }
    this.propsChange.emit(next);
  }

  /** When Input type changes, suggest label, placeholder, and field key. */
  private applyUserInputTypeDefaults(props: Record<string, unknown>, inputType: string): void {
    const presets: Record<string, { label: string; placeholder: string; fieldKey?: string }> = {
      text: { label: 'User Input', placeholder: 'Enter value…' },
      email: { label: 'Email', placeholder: 'you@example.com', fieldKey: 'email' },
      password: { label: 'Password', placeholder: 'At least 8 characters', fieldKey: 'password' },
      number: { label: 'Number', placeholder: '0' },
      phone: { label: 'Phone', placeholder: '+1 555 0100', fieldKey: 'phone' },
      url: { label: 'Website', placeholder: 'https://…' },
      textarea: { label: 'Long Text', placeholder: 'Enter details…' },
      checkbox: { label: 'Checkbox', placeholder: '' },
      toggle: { label: 'Toggle', placeholder: '' },
      dropdown: { label: 'Dropdown', placeholder: 'Select…' },
      radio: { label: 'Choice', placeholder: '' },
      date: { label: 'Date', placeholder: '' },
      file: { label: 'Upload', placeholder: '' },
    };
    const preset = presets[inputType];
    if (!preset) {
      return;
    }

    const currentLabel = String(props['label'] ?? '').trim();
    const genericLabels = new Set([
      'User Input',
      'Short Text',
      'Email',
      'Password',
      'Number',
      'Phone',
      'Website',
      'Long Text',
      'Checkbox',
      'Toggle',
      'Dropdown',
      'Choice',
      'Date',
      'Upload',
    ]);
    if (!currentLabel || genericLabels.has(currentLabel)) {
      props['label'] = preset.label;
    }

    const currentPlaceholder = String(props['placeholder'] ?? '').trim();
    if (!currentPlaceholder || currentPlaceholder === 'Enter value…' || currentPlaceholder.startsWith('Enter ')) {
      props['placeholder'] = preset.placeholder;
    }

    const currentKey = String(props['fieldKey'] ?? '').trim();
    if (!currentKey) {
      if (preset.fieldKey) {
        props['fieldKey'] = preset.fieldKey;
      } else {
        props['fieldKey'] = slugifyFieldKey(String(props['label'] ?? preset.label));
      }
    }

    if (inputType === 'file') {
      if (!String(props['accept'] ?? '').trim()) {
        props['accept'] = 'image/*';
      }
    }
  }

  private applyTextTypeDefaults(props: Record<string, unknown>, textType: string): void {
    const presets: Record<string, { content: string }> = {
      h1: { content: 'Heading 1' },
      h2: { content: 'Heading 2' },
      h3: { content: 'Heading 3' },
      h4: { content: 'Heading 4' },
      body: { content: 'Text content' },
      label: { content: 'Label' },
    };
    const preset = presets[textType];
    if (!preset) {
      return;
    }
    const current = String(props['content'] ?? '').trim();
    const generic = new Set(['Heading', 'Heading 1', 'Heading 2', 'Heading 3', 'Heading 4', 'Text content', 'Label']);
    if (!current || generic.has(current)) {
      props['content'] = preset.content;
    }
  }

  private applyMediaTypeDefaults(props: Record<string, unknown>, mediaType: string): void {
    if (mediaType === 'avatar' && !String(props['initials'] ?? '').trim()) {
      props['initials'] = 'AB';
    }
    if (mediaType === 'icon' && !String(props['iconName'] ?? '').trim()) {
      props['iconName'] = 'star';
    }
  }

  private applyContainerTypeDefaults(props: Record<string, unknown>, containerType: string): void {
    const labels: Record<string, string> = {
      section: 'Section',
      header: 'Header',
      footer: 'Footer',
      sidebar: 'Sidebar',
      row: 'Row',
      card: 'Card',
      page: 'Page',
    };
    const directions: Record<string, string> = {
      header: 'row',
      footer: 'row',
      sidebar: 'column',
    };
    const label = labels[containerType];
    if (label) {
      const current = String(props['label'] ?? '').trim();
      const genericLabels = new Set(Object.values(labels));
      if (!current || genericLabels.has(current)) {
        props['label'] = label;
      }
    }
    const direction = directions[containerType];
    if (direction) {
      props['direction'] = direction;
    }
  }

  private applyDisplayTypeDefaults(props: Record<string, unknown>, displayType: string): void {
    if (displayType === 'badge' && !String(props['text'] ?? '').trim()) {
      props['text'] = 'Badge';
    }
  }

  private applyWidgetTypeDefaults(props: Record<string, unknown>, widgetType: string): void {
    const titles: Record<string, string> = {
      data_table: 'Data Table',
      kanban: 'Kanban Board',
      navbar: 'Navigation',
      tabs: 'Tabs',
      accordion: 'Accordion',
      stepper: 'Stepper',
      breadcrumb: 'Breadcrumb',
    };
    const title = titles[widgetType];
    if (title) {
      const current = String(props['title'] ?? '').trim();
      if (!current) {
        props['title'] = title;
      }
    }
  }

  private applyButtonAppearanceDefaults(props: Record<string, unknown>, appearance: string): void {
    if (appearance === 'link') {
      const current = String(props['label'] ?? '').trim();
      if (!current || current === 'Click Me') {
        props['label'] = 'Forgot password?';
      }
    } else if (appearance === 'social') {
      const raw = props['providers'];
      if (!Array.isArray(raw) || raw.length === 0) {
        props['providers'] = ['google'];
      }
      props['label'] = '';
    } else {
      const current = String(props['label'] ?? '').trim();
      if (!current || current === 'Forgot password?') {
        props['label'] = 'Click Me';
      }
    }
  }

  protected listItems(key: string): string[] {
    const value = this.props()[key];
    if (!Array.isArray(value)) {
      return [];
    }
    return value.map(String);
  }

  protected setListItem(key: string, index: number, value: string): void {
    const items = [...this.listItems(key)];
    items[index] = value;
    this.setProp(key, items);
  }

  protected addListItem(key: string): void {
    this.setProp(key, [...this.listItems(key), 'New item']);
  }

  protected removeListItem(key: string, index: number): void {
    const items = this.listItems(key).filter((_, i) => i !== index);
    this.setProp(key, items);
  }

  /** ---- `checkbox_group` (multi-select) editor ---- */

  /** True when `opt` is among the values stored (as an array) under `key`. */
  protected isChecked(key: string, opt: string): boolean {
    return this.listItems(key).includes(opt);
  }

  /** Adds/removes `opt` from the array stored under `key`, preserving the
   *  order of `orderedOptions` so the result stays stable regardless of the
   *  order in which options were toggled. */
  protected toggleMulti(
    key: string,
    opt: string,
    orderedOptions: string[],
    event: Event,
  ): void {
    const checked = (event.target as HTMLInputElement).checked;
    const selected = new Set(this.listItems(key));
    if (checked) {
      selected.add(opt);
    } else {
      selected.delete(opt);
    }
    this.setProp(key, orderedOptions.filter((o) => selected.has(o)));
  }

  protected asString(value: unknown): string {
    return value == null ? '' : String(value);
  }

  protected asNumber(value: unknown): number | null {
    return typeof value === 'number' ? value : null;
  }

  protected asBoolean(value: unknown): boolean {
    return !!value;
  }

  /** ---- `page_select` editor (used by Data Table's "source page", etc.) ---- */

  protected pageOptions(): PageRead[] {
    return this.pagesStore.pages();
  }

  protected pageOptionLabel(page: PageRead): string {
    return page.is_default ? `${page.name} (default)` : page.name;
  }

  /** ---- `action` compound editor (used by Button, Link Button, Social Login Button) ---- */

  protected actionValue(key: string): Record<string, unknown> {
    const value = this.getProp(key);
    return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  }

  protected actionType(key: string): string {
    return this.asString(this.actionValue(key)['actionType']) || 'none';
  }

  protected setActionField(key: string, field: string, value: unknown): void {
    this.setProp(key, { ...this.actionValue(key), [field]: value });
  }

  protected setActionType(key: string, actionType: string): void {
    const next: Record<string, unknown> = { ...this.actionValue(key), actionType };
    if (actionType === 'navigate' && !this.asString(next['targetPageId'])) {
      const pages = this.pageOptions();
      if (pages.length) {
        next['targetPageId'] = pages[0].id;
      }
    }
    this.setProp(key, next);
  }

  /** ---- `formula` editor (Text / Heading data-binding) ---- */

  /** Inserts a `{{variable}}` token at the end of the current formula. */
  protected insertVariable(key: string, variable: string): void {
    const current = this.asString(this.getProp(key));
    const spacer = current && !/\s$/.test(current) ? ' ' : '';
    this.setProp(key, `${current}${spacer}{{${variable}}}`);
  }

  /** ---- `image` editor (upload + URL) ---- */

  protected imagePreviewUrl(key: string): string {
    return this.uploadService.toAbsoluteUrl(this.asString(this.getProp(key)));
  }

  protected onImageFileSelected(key: string, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.uploadError.set('Please choose an image file (PNG, JPG, SVG, …).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.uploadError.set('Image must be 5 MB or smaller.');
      return;
    }

    this.uploadError.set(null);
    this.uploadingKey.set(key);
    this.uploadService.uploadImage(file).subscribe({
      next: (url) => {
        this.setProp(key, url);
        this.uploadingKey.set(null);
      },
      error: (err: Error) => {
        this.uploadingKey.set(null);
        this.uploadError.set(err?.message || 'Upload failed. Check that the backend is running.');
      },
    });
  }

  protected clearImage(key: string): void {
    this.setProp(key, '');
    this.uploadError.set(null);
  }

  /** ---- `field_key` editor (database column mapping) ---- */

  protected setFieldKey(propKey: string, value: string): void {
    this.setProp(propKey, value.trim().replace(/\s+/g, '_'));
  }

  /** Fill database key from the current Label (any app / any field name). */
  protected useLabelAsFieldKey(propKey: string): void {
    const label = String(this.props()['label'] ?? '').trim();
    this.setProp(propKey, slugifyFieldKey(label || 'field'));
  }

  /**
   * Keep fieldKey in sync with Label while it still looks auto-generated
   * (empty, or matches a previous slug of the label). Manual keys are left alone.
   */
  private syncFieldKeyFromLabel(props: Record<string, unknown>, label: string): void {
    const current = String(props['fieldKey'] ?? '').trim();
    const nextSlug = slugifyFieldKey(label);
    if (!current || current === slugifyFieldKey(String(this.props()['label'] ?? ''))) {
      props['fieldKey'] = nextSlug;
    }
  }

  protected fieldKeyHint(key: string): string | null {
    const trimmed = key.trim();
    if (!trimmed) {
      return 'Type any key, or click From label. On Save Layout this becomes a column in this page’s auto-created collection.';
    }
    const preset = this.authFieldKeyPresets.find((p) => p.key === trimmed);
    if (preset?.hint) {
      return preset.hint;
    }
    if (AUTH_FIELD_KEYS.has(trimmed)) {
      return 'Recognized by Sign up / Log in actions.';
    }
    return `Saved as "${trimmed}" in this page’s data collection when you Save Layout.`;
  }

  protected applyFieldKeyPreset(propKey: string, presetKey: string): void {
    if (presetKey) {
      this.setProp(propKey, presetKey);
    }
  }

  protected providerOptionLabel(provider: string): string {
    const labels: Record<string, string> = {
      google: 'Google',
      facebook: 'Facebook',
      twitter: 'X (Twitter)',
      microsoft: 'Microsoft',
      github: 'GitHub',
      apple: 'Apple',
      linkedin: 'LinkedIn',
    };
    return labels[provider] ?? provider;
  }

  protected selectOptionLabel(fieldKey: string, option: string): string {
    const labels: Record<string, Record<string, string>> = {
      inputType: {
        text: 'Text',
        email: 'Email',
        password: 'Password',
        number: 'Number',
        phone: 'Phone',
        url: 'URL',
        textarea: 'Long text',
        checkbox: 'Checkbox',
        toggle: 'Toggle',
        dropdown: 'Dropdown',
        radio: 'Radio group',
        date: 'Date',
        file: 'File upload',
      },
      textType: {
        h1: 'Heading 1',
        h2: 'Heading 2',
        h3: 'Heading 3',
        h4: 'Heading 4',
        body: 'Body text',
        label: 'Label',
      },
      mediaType: {
        image: 'Image / Logo',
        avatar: 'Avatar',
        icon: 'Icon',
        video: 'Video',
      },
      containerType: {
        section: 'Section',
        header: 'Header',
        footer: 'Footer',
        sidebar: 'Sidebar',
        row: 'Row',
        card: 'Card',
        page: 'Page',
      },
      displayType: {
        badge: 'Badge',
        divider: 'Divider',
        spacer: 'Spacer',
        progress: 'Progress bar',
        rating: 'Rating',
        list: 'List',
      },
      widgetType: {
        data_table: 'Data table',
        kanban: 'Kanban board',
        navbar: 'Navbar',
        tabs: 'Tabs',
        accordion: 'Accordion',
        stepper: 'Stepper',
        breadcrumb: 'Breadcrumb',
      },
      appearance: {
        button: 'Button',
        link: 'Text link',
        social: 'Social login',
      },
    };
    return labels[fieldKey]?.[option] ?? option;
  }
}
