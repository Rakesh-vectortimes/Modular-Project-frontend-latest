/** Shared compact form styling for canvas + runtime shape components. */
export const RENDERER_FIELD_STYLES = `
  .field {
    display: flex;
    flex-direction: column;
    gap: var(--renderer-field-gap, 0.25rem);
    width: 100%;
    box-sizing: border-box;
  }
  .label {
    flex: 0 0 auto;
    font-size: var(--renderer-label-size, 0.8125rem);
    font-weight: var(--renderer-label-weight, 500);
    line-height: 1.25;
    color: var(--renderer-label-color, #374151);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  input,
  select,
  textarea {
    flex: 0 0 auto;
    width: 100%;
    height: var(--renderer-input-height, 2.5rem);
    box-sizing: border-box;
    padding: var(--renderer-input-padding, 0.5rem 0.75rem);
    border: 1px solid var(--renderer-input-border, #d1d5db);
    border-radius: var(--renderer-input-radius, 6px);
    font-size: var(--renderer-input-font, 0.875rem);
    line-height: 1.25;
    background: #fff;
    color: #1f2937;
  }
  input[readonly],
  select[readonly],
  textarea[readonly] {
    pointer-events: none;
  }
`;

export const RENDERER_BUTTON_HOST_STYLES = `
  :host {
    display: block;
    width: 100%;
    height: 100%;
  }
`;

export const RENDERER_PRIMARY_BUTTON_STYLES = `
  ${RENDERER_BUTTON_HOST_STYLES}
  .btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    min-height: var(--renderer-btn-height, 2.5rem);
    padding: var(--renderer-btn-padding, 0 1rem);
    border-radius: var(--renderer-input-radius, 6px);
    font-size: var(--renderer-btn-font, 0.875rem);
    font-weight: 500;
    line-height: 1.25;
    border: 1px solid transparent;
    cursor: pointer;
    box-sizing: border-box;
  }
  .btn:disabled {
    cursor: default;
  }
  .primary {
    background: var(--teal-600, #17a2b8);
    color: #fff;
  }
  .secondary {
    background: #6b7280;
    color: #fff;
  }
  .outline {
    background: #fff;
    color: var(--teal-600, #17a2b8);
    border-color: var(--teal-600, #17a2b8);
  }
  .danger {
    background: #dc2626;
    color: #fff;
  }
`;

export const RENDERER_SOCIAL_BUTTON_STYLES = `
  ${RENDERER_BUTTON_HOST_STYLES}
  .social-stack {
    display: flex;
    flex-direction: column;
    gap: var(--renderer-stack-gap, 0.5rem);
    width: 100%;
    height: 100%;
  }
  .social-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 var(--renderer-btn-height, 2.5rem);
    width: 100%;
    height: var(--renderer-btn-height, 2.5rem);
    padding: 0 1rem;
    border-radius: var(--renderer-input-radius, 6px);
    font-size: var(--renderer-btn-font, 0.875rem);
    font-weight: 500;
    line-height: 1.25;
    border: 1px solid #d1d5db;
    background: #fff;
    color: #1f2937;
    cursor: pointer;
    box-sizing: border-box;
  }
  .social-btn:disabled {
    cursor: default;
  }
  .provider-google,
  .provider-microsoft {
    border-color: #dadce0;
  }
  .provider-github {
    background: #24292f;
    color: #fff;
    border-color: #24292f;
  }
  .provider-facebook {
    background: #1877f2;
    color: #fff;
    border-color: #1877f2;
  }
  .provider-twitter,
  .provider-apple {
    background: #000;
    color: #fff;
    border-color: #000;
  }
  .provider-linkedin {
    background: #0a66c2;
    color: #fff;
    border-color: #0a66c2;
  }
`;
