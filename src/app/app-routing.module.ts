import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { ClipBuilderComponent } from './clipbuilder/clipbuilder.component';

import { HomeComponent } from './home/home.component';
import { LayerFinderComponent } from './layerfinder/layerfinder.component';
import { LayerUploadComponent } from './layerupload/layerupload.component';
import { MyLibraryComponent } from './mylibrary/mylibrary.component';
import { MusicVideoBuilderComponent } from './musicvideobuilder/musicvideobuilder.component';

const routes: Routes = [
  {
    path: 'layerFinder',
    component: LayerFinderComponent
  },
  {
    path: 'layerUpload',
    component: LayerUploadComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'clipBuilder',
    component: ClipBuilderComponent,
    canActivate: [
      MsalGuard
    ],
    children: [
      {
        path: ':id',
        component: ClipBuilderComponent,
        canActivate: [
          MsalGuard
        ]
      }
    ]
  },
  {
    path: 'musicVideoBuilder',
    component: MusicVideoBuilderComponent,
    canActivate: [
      MsalGuard
    ],
    children: [
      {
        path: ':id',
        component: ClipBuilderComponent,
        canActivate: [
          MsalGuard
        ]
      }
    ]
  },
  {
    path: 'myLibrary',
    component: MyLibraryComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
  // Needed for hash routing
  path: 'error',
  component: HomeComponent
},
{
  // Needed for hash routing
  path: 'state',
  component: HomeComponent
},
{
  // Needed for hash routing
  path: 'code',
  component: HomeComponent
},
{
  path: '',
  component: HomeComponent
}
];

const isIframe = window !== window.parent && !window.opener;

@NgModule({
  imports: [RouterModule.forRoot(routes, {
    // Don't perform initial navigation in iframes
    initialNavigation: !isIframe ? 'enabled' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
