import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription, switchMap } from 'rxjs';

import { PageRead } from '../../core/models';
import { PageService } from '../../core/services/page.service';
import { RuntimeContextService } from '../../core/services/runtime-context.service';
import { RuntimeFormStateService } from '../../core/services/runtime-form-state.service';
import { RuntimeToastService } from '../../core/services/runtime-toast.service';
import { provideComponentRendererRegistry } from '../../shared/renderer/component-type-registry';
import { frameLayoutToArtboard } from '../../shared/renderer/layout-frame.util';
import { RuntimeViewportComponent } from '../../shared/renderer/runtime-viewport.component';
import { RenderNode } from '../../shared/renderer/render-node.model';
import { RuntimeNodeComponent } from './runtime-node.component';

/**
 * Hosts a running (interactive) software page — Preview/Run mode.
 * Route: `/run/:softwareId` or `/run/:softwareId/:pageId`.
 */
@Component({
  selector: 'app-runtime-shell',
  standalone: true,
  imports: [RuntimeNodeComponent, RuntimeViewportComponent],
  providers: [provideComponentRendererRegistry()],
  template: `
    <div class="runtime-shell">
      @if (loading()) {
        <p class="status">Loading…</p>
      } @else if (error()) {
        <p class="status error">{{ error() }}</p>
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
      color: #94a3b8;
    }
    .status.error {
      color: #f87171;
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
export class RuntimeShellComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly pageService = inject(PageService);
  private readonly runtimeContext = inject(RuntimeContextService);
  private readonly formState = inject(RuntimeFormStateService);
  protected readonly toast = inject(RuntimeToastService);

  private subscription?: Subscription;

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly page = signal<PageRead | null>(null);
  protected readonly nodes = signal<RenderNode[]>([]);
  protected readonly stageWidth = signal(0);
  protected readonly stageHeight = signal(0);
  protected readonly pageBackground = signal<{ color: string; image: string }>({
    color: '#f8fafc',
    image: '',
  });

  protected pageBackgroundColor(): string {
    return this.pageBackground().color;
  }

  protected pageBackgroundImage(): string | null {
    const url = this.pageBackground().image.trim();
    return url ? `url(${url})` : null;
  }

  ngOnInit(): void {
    this.subscription = this.route.paramMap
      .pipe(
        switchMap((params) => {
          this.loading.set(true);
          this.error.set(null);
          const softwareId = params.get('softwareId')!;
          const pageId = params.get('pageId');
          return this.resolvePage(softwareId, pageId);
        }),
      )
      .subscribe({
        error: () => {
          this.loading.set(false);
          this.error.set('Failed to load this page.');
        },
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.runtimeContext.clear();
  }

  private resolvePage(softwareId: string, pageId: string | null) {
    return this.pageService.list(softwareId).pipe(
      switchMap((pages) => {
        const target = pageId
          ? pages.find((p) => p.id === pageId)
          : pages.find((p) => p.is_default) ?? pages[0];

        if (!target) {
          this.error.set('This software has no pages yet.');
          this.loading.set(false);
          return [];
        }

        this.page.set(target);
        this.runtimeContext.set(softwareId, target.id);
        this.formState.setPage(target.id);

        return this.pageService.getLayout(target.id).pipe(
          switchMap((layout) => {
            const tree = layout.components as unknown as RenderNode[];
            const framed = frameLayoutToArtboard(tree, layout.settings);
            this.nodes.set(framed.nodes);
            this.stageWidth.set(framed.width);
            this.stageHeight.set(framed.height);
            this.runtimeContext.setLayout(framed.nodes);
            this.pageBackground.set({
              color: layout.settings?.backgroundColor || '#f8fafc',
              image: layout.settings?.backgroundImage || '',
            });
            this.seedInputDefaults(framed.nodes);
            this.loading.set(false);
            return [];
          }),
        );
      }),
    );
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
