import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { ClipBuilderComponent } from './clipbuilder/clipbuilder.component';

import { HomeComponent } from './home/home.component';
import { ContentBrowserComponent } from './contentbrowser/contentbrowser.component';
import { LayerUploadComponent } from './layerupload/layerupload.component';
import { MyLibraryComponent } from './mylibrary/mylibrary.component';
import { MusicVideoBuilderComponent } from './musicvideobuilder/musicvideobuilder.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';

const routes: Routes = [
  {
    path: 'contentBrowser',
    component: ContentBrowserComponent
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
    path: 'confirmation',
    component: ConfirmationComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: '',
    component: HomeComponent
  },
  {
    path: '**',
    component: NotfoundComponent
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
