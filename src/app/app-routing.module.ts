import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ClipBuilderComponent } from './clipbuilder/clipbuilder.component';

import { HomeComponent } from './home/home.component';
import { ContentBrowserComponent } from './contentbrowser/contentbrowser.component';
import { MyLibraryComponent } from './mylibrary/mylibrary.component';
import { MusicVideoBuilderComponent } from './musicvideobuilder/musicvideobuilder.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { ConfirmationgaurdGuard } from './confirmationgaurd.guard';
import { HelpComponent } from './help/help.component';

const routes: Routes = [
  {
    path: 'contentBrowser',
    component: ContentBrowserComponent
  },
  {
    path: 'help',
    component: HelpComponent
  },
  {
    path: 'clipBuilder',
    component: ClipBuilderComponent,
    canDeactivate:[
      ConfirmationgaurdGuard
    ],
    children: [
      {
        path: ':id',
        component: ClipBuilderComponent
      }
    ]
  },
  {
    path: 'musicVideoBuilder',
    component: MusicVideoBuilderComponent,
    canDeactivate:[
      ConfirmationgaurdGuard
    ],
    children: [
      {
        path: ':id',
        component: ClipBuilderComponent
      }
    ]
  },
  {
    path: 'myLibrary',
    component: MyLibraryComponent
  },
  {
    path: 'confirmation',
    component: ConfirmationComponent
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
    initialNavigation: !isIframe ? 'enabledNonBlocking' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
