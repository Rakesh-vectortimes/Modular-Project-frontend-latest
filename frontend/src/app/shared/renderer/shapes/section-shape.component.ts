import { Component, computed, input } from '@angular/core';

import { numberProp, RenderNode, stringProp } from '../render-node.model';

type SemanticTag = 'section' | 'header' | 'footer' | 'aside';

@Component({
  selector: 'app-section-shape',
  standalone: true,
  template: `
    @switch (semanticTag()) {
      @case ('header') {
        <header
          class="section section--header"
          [style.backgroundColor]="backgroundColor()"
          [style.padding.px]="padding()"
          [style.flexDirection]="direction()"
          [style.gap.px]="gap()"
        >
          @if (showLabel()) {
            <div class="section-label">{{ label() }}</div>
          }
          <ng-content />
        </header>
      }
      @case ('footer') {
        <footer
          class="section section--footer"
          [style.backgroundColor]="backgroundColor()"
          [style.padding.px]="padding()"
          [style.flexDirection]="direction()"
          [style.gap.px]="gap()"
        >
          @if (showLabel()) {
            <div class="section-label">{{ label() }}</div>
          }
          <ng-content />
        </footer>
      }
      @case ('aside') {
        <aside
          class="section section--sidebar"
          [style.backgroundColor]="backgroundColor()"
          [style.padding.px]="padding()"
          [style.flexDirection]="direction()"
          [style.gap.px]="gap()"
        >
          @if (showLabel()) {
            <div class="section-label">{{ label() }}</div>
          }
          <ng-content />
        </aside>
      }
      @default {
        <section
          class="section"
          [style.backgroundColor]="backgroundColor()"
          [style.padding.px]="padding()"
          [style.flexDirection]="direction()"
          [style.gap.px]="gap()"
        >
          @if (showLabel()) {
            <div class="section-label">{{ label() }}</div>
          }
          <ng-content />
        </section>
      }
    }
  `,
  styles: `
    .section {
      width: 100%;
      height: 100%;
      min-height: 3rem;
      box-sizing: border-box;
      border-radius: var(--renderer-input-radius, 8px);
      border: 1px solid var(--border-light, #edf2f7);
      display: flex;
    }
    .section-label {
      font-size: 0.6875rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #94a3b8;
    }
  `,
})
export class SectionShapeComponent {
  readonly node = input.required<RenderNode>();
  readonly interactive = input(false);

  protected containerKind = computed(() =>
    stringProp(this.node().props, 'containerType', 'section').toLowerCase(),
  );

  protected semanticTag = computed((): SemanticTag => {
    switch (this.containerKind()) {
      case 'header':
        return 'header';
      case 'footer':
        return 'footer';
      case 'sidebar':
        return 'aside';
      default:
        return 'section';
    }
  });

  protected label(): string {
    const kind = this.containerKind();
    const defaults: Record<string, string> = {
      header: 'Header',
      footer: 'Footer',
      sidebar: 'Sidebar',
      section: 'Section',
    };
    return stringProp(this.node().props, 'label', defaults[kind] ?? 'Section');
  }

  protected backgroundColor(): string {
    return stringProp(this.node().props, 'backgroundColor', '#ffffff');
  }

  protected padding(): number {
    return numberProp(this.node().props, 'padding', 24);
  }

  protected direction(): string {
    const value = stringProp(this.node().props, 'direction', 'column');
    return value === 'row' ? 'row' : 'column';
  }

  protected gap(): number {
    return numberProp(this.node().props, 'gap', 12);
  }

  /** Hide generic "Section"; keep Header/Footer/Sidebar labels visible in the builder. */
  protected showLabel(): boolean {
    const value = this.label().trim();
    if (!value) {
      return false;
    }
    return value.toLowerCase() !== 'section';
  }
}
