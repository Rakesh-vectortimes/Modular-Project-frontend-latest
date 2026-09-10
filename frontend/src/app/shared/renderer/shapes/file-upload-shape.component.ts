import { Component, inject, input, signal } from '@angular/core';

import { RuntimeFormStateService } from '../../../core/services/runtime-form-state.service';
import { UploadService } from '../../../core/services/upload.service';
import { booleanProp, RenderNode, stringProp } from '../render-node.model';

@Component({
  selector: 'app-file-upload-shape',
  standalone: true,
  template: `
    <label class="field">
      @if (hasLabel()) {
        <span class="label">
          {{ label() }}
          @if (required()) {
            <span class="req">*</span>
          }
        </span>
      }
      <input
        type="file"
        [disabled]="!interactive() || uploading()"
        [accept]="accept()"
        [multiple]="multiple()"
        (change)="onFileChange($event)"
      />
      @if (uploading()) {
        <span class="status">Uploading…</span>
      } @else if (error()) {
        <span class="status error">{{ error() }}</span>
      } @else if (preview()) {
        <span class="status ok">{{ preview() }}</span>
      }
    </label>
  `,
  styles: `
    .field {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      width: 100%;
    }
    .label {
      font-size: 0.875rem;
      font-weight: 500;
      color: #374151;
    }
    .req {
      color: #dc2626;
      margin-left: 0.125rem;
    }
    input {
      padding: 0.375rem 0;
      font-size: 0.8125rem;
    }
    .status {
      font-size: 0.75rem;
      color: #64748b;
      word-break: break-all;
    }
    .status.error {
      color: #dc2626;
    }
    .status.ok {
      color: #15803d;
    }
  `,
})
export class FileUploadShapeComponent {
  private readonly formState = inject(RuntimeFormStateService);
  private readonly upload = inject(UploadService);

  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected readonly uploading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly preview = signal<string | null>(null);

  protected label(): string {
    return stringProp(this.node().props, 'label', 'Upload File');
  }

  protected hasLabel(): boolean {
    return this.label().trim().length > 0;
  }

  protected required(): boolean {
    return booleanProp(this.node().props, 'required');
  }

  protected accept(): string {
    return stringProp(this.node().props, 'accept', 'image/*');
  }

  protected multiple(): boolean {
    return booleanProp(this.node().props, 'multiple');
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    if (!this.interactive() || !files.length) {
      return;
    }

    const fieldKey = stringProp(this.node().props, 'fieldKey', '').trim();
    if (!fieldKey) {
      this.error.set('Set a Field Key in Properties so uploads are saved.');
      return;
    }

    this.error.set(null);
    this.uploading.set(true);

    const uploads = files.map((file) => this.upload.uploadImage(file));
    // Sequential to keep UI simple and avoid hammering the API.
    const urls: string[] = [];
    const runNext = (index: number): void => {
      if (index >= uploads.length) {
        this.uploading.set(false);
        const value = this.multiple() ? urls : urls[0] ?? '';
        this.formState.setValue(fieldKey, value);
        this.preview.set(
          this.multiple() ? `${urls.length} file(s) uploaded` : urls[0] || 'Uploaded',
        );
        return;
      }
      uploads[index].subscribe({
        next: (url) => {
          urls.push(url);
          runNext(index + 1);
        },
        error: (err: Error) => {
          this.uploading.set(false);
          this.error.set(err?.message || 'Upload failed.');
        },
      });
    };
    runNext(0);
  }
}
