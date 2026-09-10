import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';
import { finalize, map, switchMap } from 'rxjs/operators';

import { PublishedLayoutRead } from '@app-builder/core/models/page-component-node.model';
import {
  LayoutTreeComponent,
  provideComponentRendererRegistry,
  RenderNode,
} from '@app-builder/shared';

import { PublishedLayoutService } from './core/published-layout.service';

@Component({
  selector: 'app-published-page',
  standalone: true,
  imports: [LayoutTreeComponent],
  providers: [provideComponentRendererRegistry()],
  templateUrl: './published-page.component.html',
  styleUrl: './published-page.component.scss',
})
export class PublishedPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly layoutService = inject(PublishedLayoutService);

  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);
  protected readonly layout = signal<PublishedLayoutRead | null>(null);
  protected readonly nodes = signal<RenderNode[]>([]);

  protected pageBackgroundColor(): string {
    return this.layout()?.settings?.backgroundColor || '#f4f5f7';
  }

  protected pageBackgroundImage(): string | null {
    const url = this.layout()?.settings?.backgroundImage?.trim();
    return url ? `url(${url})` : null;
  }

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('softwareId') ?? ''),
        switchMap((softwareId) => {
          this.loading.set(true);
          this.error.set(null);
          this.layout.set(null);
          this.nodes.set([]);

          if (!softwareId.trim()) {
            this.error.set('Invalid software id in URL.');
            this.loading.set(false);
            return EMPTY;
          }

          return this.layoutService.getLayout(softwareId).pipe(
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe({
        next: (data) => {
          this.layout.set(data);
          this.nodes.set(data.components as RenderNode[]);
        },
        error: () =>
          this.error.set(
            'Unable to load published app. Ensure the software exists and has a default page with a saved layout.',
          ),
      });
  }
}
