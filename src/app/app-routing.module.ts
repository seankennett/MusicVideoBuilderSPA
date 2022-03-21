import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';

import { HomeComponent } from './home/home.component';
import { LayerFinderComponent } from './layerfinder/layerfinder.component';
import { LayerUploadComponent } from './layerupload/layerupload.component';

const routes: Routes = [
  {
    path: 'layerFinder',
    component: LayerFinderComponent,
    canActivate: [
      MsalGuard
    ]
  },
  {
    path: 'layerUpload',
    component: LayerUploadComponent,
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
