import { Component, inject } from '@angular/core';

import { PageBuilderComponent } from '../pages/builder/page-builder.component';
import { PagesTabComponent } from '../pages/pages-tab.component';
import { SelectedPageService } from '../../core/services/selected-page.service';
import { PageBuilderLayoutService } from '../../core/services/page-builder-layout.service';

@Component({
  selector: 'app-pages-page',
  standalone: true,
  imports: [PagesTabComponent, PageBuilderComponent],
  templateUrl: './pages-page.component.html',
  styleUrl: './pages-page.component.scss',
})
export class PagesPageComponent {
  protected readonly selectedPage = inject(SelectedPageService);
  protected readonly layout = inject(PageBuilderLayoutService);
}
