import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { PublishedLayoutRead } from '../../core/models';
import { RuntimeContextService } from '../../core/services/runtime-context.service';
import { RuntimeFormStateService } from '../../core/services/runtime-form-state.service';
import { RuntimeToastService } from '../../core/services/runtime-toast.service';
import { SoftwareService } from '../../core/services/software.service';
import { provideComponentRendererRegistry } from '../../shared/renderer/component-type-registry';
import { frameLayoutToArtboard } from '../../shared/renderer/layout-frame.util';
import { RuntimeViewportComponent } from '../../shared/renderer/runtime-viewport.component';
import { RenderNode } from '../../shared/renderer/render-node.model';
import { RuntimeNodeComponent } from './runtime-node.component';

/**
 * Anonymous published app — no login required.
 * Route: `/p/:softwareId` → GET /software/{id}/published (public API).
 */
@Component({
  selector: 'app-public-app-shell',
  standalone: true,
  imports: [RuntimeNodeComponent, RuntimeViewportComponent],
  providers: [provideComponentRendererRegistry()],
  template: `
    <div
      class="runtime-shell"
      [style.backgroundColor]="pageBackgroundColor()"
      [style.backgroundImage]="pageBackgroundImage()"
    >
      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (error()) {
        <div class="status error">
          <h1>App unavailable</h1>
          <p>{{ error() }}</p>
        </div>
      } @else {
        <app-runtime-viewport
          [contentWidth]="stageWidth()"
          [contentHeight]="stageHeight()"
        >
          <div
            class="page-surface"
            [style.width.px]="stageWidth()"
            [style.height.px]="stageHeight()"
            [style.backgroundColor]="pageBackgroundColor()"
            [style.backgroundImage]="pageBackgroundImage()"
          >
            @for (node of nodes(); track node.id) {
              <app-runtime-node [node]="node" [isRoot]="true" />
            }
          </div>
        </app-runtime-viewport>
      }

      <div class="toast-stack">
        @for (t of toast.toasts(); track t.id) {
          <div class="toast" [class]="'toast-' + t.tone" (click)="toast.dismiss(t.id)">
            {{ t.message }}
          </div>
        }
      </div>
    </div>
  `,
  styles: `
    .runtime-shell {
      height: 100vh;
      width: 100%;
      overflow: hidden;
      background: #f4f6f9;
    }
    .page-surface {
      position: relative;
      width: 100%;
      height: 100%;
      overflow: hidden;
      background-size: cover;
      background-position: center;
      background-repeat: no-repeat;
    }
    .status {
      padding: 2rem;
      text-align: center;
      color: #6b7280;
    }
    .status.error {
      color: #dc2626;
    }
    .status.error h1 {
      margin: 0 0 0.5rem;
      font-size: 1.25rem;
      color: #991b1b;
    }
    .status.error p {
      margin: 0;
    }
    .toast-stack {
      position: fixed;
      right: 1rem;
      bottom: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      z-index: 1000;
    }
    .toast {
      padding: 0.625rem 1rem;
      border-radius: 8px;
      font-size: 0.8125rem;
      font-weight: 500;
      color: #fff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      max-width: 20rem;
    }
    .toast-success {
      background: #16a34a;
    }
    .toast-error {
      background: #dc2626;
    }
    .toast-info {
      background: #1f2937;
    }
  `,
})
export class PublicAppShellComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly softwareService = inject(SoftwareService);
  private readonly runtimeContext = inject(RuntimeContextService);
  private readonly formState = inject(RuntimeFormStateService);
  protected readonly toast = inject(RuntimeToastService);

  private subscription?: Subscription;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly layout = signal<PublishedLayoutRead | null>(null);
  protected readonly nodes = signal<RenderNode[]>([]);
  protected readonly stageWidth = signal(0);
  protected readonly stageHeight = signal(0);

  protected pageBackgroundColor(): string {
    return this.layout()?.settings?.backgroundColor || '#f8fafc';
  }

  protected pageBackgroundImage(): string | null {
    const url = this.layout()?.settings?.backgroundImage?.trim();
    return url ? `url(${url})` : null;
  }

  ngOnInit(): void {
    this.subscription = this.route.paramMap.subscribe((params) => {
      const softwareId = params.get('softwareId')?.trim() ?? '';
      const pageId = params.get('pageId')?.trim() || undefined;
      this.loadPublished(softwareId, pageId);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.runtimeContext.clear();
    this.formState.clear();
  }

  private loadPublished(softwareId: string, pageId?: string): void {
    this.loading.set(true);
    this.error.set(null);
    this.layout.set(null);
    this.nodes.set([]);
    this.formState.clear();

    if (!softwareId) {
      this.error.set('Invalid app link.');
      this.loading.set(false);
      return;
    }

    this.softwareService
      .getPublishedLayout(softwareId, pageId)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (data) => {
          this.layout.set(data);
          const tree = data.components as unknown as RenderNode[];
          const framed = frameLayoutToArtboard(tree, data.settings);
          this.nodes.set(framed.nodes);
          this.stageWidth.set(framed.width);
          this.stageHeight.set(framed.height);
          this.runtimeContext.set(data.software_id, data.page_id);
          this.runtimeContext.setLayout(framed.nodes);
          this.formState.setPage(data.page_id);
          this.seedInputDefaults(framed.nodes);
        },
        error: () => {
          this.error.set(
            'Unable to load this app. Make sure it exists and has a default page with a saved layout.',
          );
        },
      });
  }

  private seedInputDefaults(nodes: RenderNode[]): void {
    for (const node of nodes) {
      const fieldKey = node.props?.['fieldKey'];
      if (typeof fieldKey === 'string' && fieldKey.trim()) {
        const value =
          node.props['defaultValue'] ?? node.props['defaultChecked'] ?? '';
        this.formState.setValue(fieldKey, value);
      }
      if (node.children?.length) {
        this.seedInputDefaults(node.children);
      }
    }
  }
}
