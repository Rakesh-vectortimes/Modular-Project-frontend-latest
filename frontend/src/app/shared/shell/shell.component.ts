import { Component, inject, signal } from '@angular/core';

import { SoftwareTabComponent } from '../../features/software/software-tab.component';

import { PagesTabComponent } from '../../features/pages/pages-tab.component';

import { PageBuilderComponent } from '../../features/pages/builder/page-builder.component';

import { SelectedSoftwareService } from '../../core/services/selected-software.service';

import { SelectedPageService } from '../../core/services/selected-page.service';



export type SidebarTab = 'software' | 'pages';



@Component({

  selector: 'app-shell',

  standalone: true,

  imports: [SoftwareTabComponent, PagesTabComponent, PageBuilderComponent],

  templateUrl: './shell.component.html',

  styleUrl: './shell.component.scss',

})

export class ShellComponent {

  protected readonly selectedSoftware = inject(SelectedSoftwareService);

  protected readonly selectedPage = inject(SelectedPageService);

  protected readonly activeTab = signal<SidebarTab>('software');



  protected setTab(tab: SidebarTab): void {

    if (tab === 'pages' && !this.selectedSoftware.hasSelection()) {

      return;

    }

    this.activeTab.set(tab);

  }



  protected onSoftwareSelected(): void {

    this.activeTab.set('pages');

  }

}


