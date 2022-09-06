import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { ClipComposerComponent } from './clipcomposer/clipcomposer.component';

import { HomeComponent } from './home/home.component';
import { LayerFinderComponent } from './layerfinder/layerfinder.component';
import { LayerUploadComponent } from './layerupload/layerupload.component';
import { MyLayersComponent } from './mylayers/mylayers.component';
import { VideoBuilderComponent } from './videobuilder/videobuilder.component';
import { VideoComposerComponent } from './videocomposer/videocomposer.component';

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
    path: 'clipComposer',
    component: ClipComposerComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'videoComposer',
    component: VideoComposerComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'videoBuilder',
    component: VideoBuilderComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'myLayers',
    component: MyLayersComponent,
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
    useHash: true,
    // Don't perform initial navigation in iframes
    initialNavigation: !isIframe ? 'enabled' : 'disabled'
  })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
