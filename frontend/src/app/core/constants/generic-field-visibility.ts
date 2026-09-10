/** Which property keys apply for each generic component variant (Properties panel filtering). */

const USER_INPUT_BASE = [
  'inputType',
  'label',
  'placeholder',
  'fieldKey',
  'required',
  'unique',
  'defaultValue',
];

const USER_INPUT_BY_TYPE: Record<string, string[]> = {
  text: USER_INPUT_BASE,
  email: USER_INPUT_BASE,
  password: [...USER_INPUT_BASE, 'showToggle'],
  number: USER_INPUT_BASE,
  phone: USER_INPUT_BASE,
  url: USER_INPUT_BASE,
  textarea: [...USER_INPUT_BASE, 'rows'],
  checkbox: ['inputType', 'label', 'fieldKey', 'required', 'defaultValue'],
  toggle: ['inputType', 'label', 'fieldKey', 'defaultValue'],
  dropdown: [...USER_INPUT_BASE, 'options'],
  radio: [...USER_INPUT_BASE, 'options'],
  date: [...USER_INPUT_BASE, 'minDate', 'maxDate'],
  file: ['inputType', 'label', 'fieldKey', 'required', 'accept', 'multiple'],
};

const TEXT_BLOCK_BY_TYPE: Record<string, string[]> = {
  h1: ['textType', 'content', 'binding', 'align', 'color'],
  h2: ['textType', 'content', 'binding', 'align', 'color'],
  h3: ['textType', 'content', 'binding', 'align', 'color'],
  h4: ['textType', 'content', 'binding', 'align', 'color'],
  body: ['textType', 'content', 'binding', 'fontSize', 'fontWeight', 'color', 'textAlign'],
  label: ['textType', 'content', 'binding', 'fontSize', 'color', 'textAlign'],
};

const MEDIA_BY_TYPE: Record<string, string[]> = {
  image: ['mediaType', 'src', 'alt', 'fit'],
  avatar: ['mediaType', 'src', 'initials', 'shape', 'size'],
  icon: ['mediaType', 'iconName', 'size', 'color'],
  video: ['mediaType', 'url', 'title'],
};

const CONTAINER_BY_TYPE: Record<string, string[]> = {
  section: ['containerType', 'label', 'backgroundColor', 'padding', 'direction', 'gap'],
  header: ['containerType', 'label', 'backgroundColor', 'padding', 'direction', 'gap'],
  footer: ['containerType', 'label', 'backgroundColor', 'padding', 'direction', 'gap'],
  sidebar: ['containerType', 'label', 'backgroundColor', 'padding', 'direction', 'gap'],
  row: ['containerType', 'label', 'backgroundColor', 'padding', 'direction', 'gap'],
  card: ['containerType', 'label', 'backgroundColor', 'padding'],
  page: ['containerType', 'label', 'backgroundColor', 'backgroundImage', 'padding'],
};

const DISPLAY_BY_TYPE: Record<string, string[]> = {
  badge: ['displayType', 'text', 'tone'],
  divider: ['displayType', 'thickness', 'style', 'color'],
  spacer: ['displayType', 'height'],
  progress: ['displayType', 'value', 'max', 'label'],
  rating: ['displayType', 'value', 'max', 'label'],
  list: ['displayType', 'items'],
};

const WIDGET_BY_TYPE: Record<string, string[]> = {
  data_table: ['widgetType', 'sourcePageId', 'title'],
  kanban: ['widgetType', 'title'],
  navbar: ['widgetType', 'title', 'links'],
  tabs: ['widgetType', 'tabs'],
  accordion: ['widgetType', 'items'],
  stepper: ['widgetType', 'steps'],
  breadcrumb: ['widgetType', 'items'],
};

const BUTTON_BY_APPEARANCE: Record<string, string[]> = {
  button: ['label', 'variant', 'appearance'],
  link: ['label', 'appearance'],
  social: ['appearance', 'providers', 'label'],
};

export function visiblePropertyKeys(componentType: string, props: Record<string, unknown>): Set<string> | null {
  switch (componentType) {
    case 'user_input': {
      const variant = String(props['inputType'] || 'text');
      return new Set(USER_INPUT_BY_TYPE[variant] ?? USER_INPUT_BASE);
    }
    case 'text_block': {
      const variant = String(props['textType'] || 'body');
      return new Set(TEXT_BLOCK_BY_TYPE[variant] ?? TEXT_BLOCK_BY_TYPE['body']);
    }
    case 'media': {
      const variant = String(props['mediaType'] || 'image');
      return new Set(MEDIA_BY_TYPE[variant] ?? MEDIA_BY_TYPE['image']);
    }
    case 'container': {
      const variant = String(props['containerType'] || 'section');
      return new Set(CONTAINER_BY_TYPE[variant] ?? CONTAINER_BY_TYPE['section']);
    }
    case 'display': {
      const variant = String(props['displayType'] || 'badge');
      return new Set(DISPLAY_BY_TYPE[variant] ?? DISPLAY_BY_TYPE['badge']);
    }
    case 'widget': {
      const variant = String(props['widgetType'] || 'data_table');
      return new Set(WIDGET_BY_TYPE[variant] ?? WIDGET_BY_TYPE['data_table']);
    }
    case 'button': {
      const appearance = String(props['appearance'] || 'button');
      return new Set(BUTTON_BY_APPEARANCE[appearance] ?? BUTTON_BY_APPEARANCE['button']);
    }
    default:
      return null;
  }
}
