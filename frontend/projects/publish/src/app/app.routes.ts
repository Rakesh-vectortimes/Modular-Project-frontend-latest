import { Routes } from '@angular/router';

import { PublishHomeComponent } from './publish-home.component';
import { PublishedPageComponent } from './published-page.component';

export const routes: Routes = [
  {
    path: 'app/:softwareId',
    component: PublishedPageComponent,
  },
  {
    path: '',
    pathMatch: 'full',
    component: PublishHomeComponent,
  },
];
