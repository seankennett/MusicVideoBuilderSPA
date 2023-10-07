import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { IPublicClientApplication, PublicClientApplication, InteractionType } from '@azure/msal-browser';
import { MsalGuard, MsalInterceptor, MsalBroadcastService, MsalInterceptorConfiguration, MsalModule, MsalService, MSAL_GUARD_CONFIG, MSAL_INSTANCE, MSAL_INTERCEPTOR_CONFIG, MsalGuardConfiguration, MsalRedirectComponent } from '@azure/msal-angular';

import { msalConfig, loginRequest, protectedResources } from './auth-config';
import { ContentBrowserComponent } from './contentbrowser/contentbrowser.component';
import { LayerUploadComponent } from './layerupload/layerupload.component';
import { LayertypecontrolComponent } from './layertypecontrol/layertypecontrol.component';
import { GalleryplayerComponent } from './galleryplayer/galleryplayer.component';
import { ClipBuilderComponent } from './clipbuilder/clipbuilder.component';
import { MusicVideoBuilderComponent } from './musicvideobuilder/musicvideobuilder.component';
import { MyLibraryComponent } from './mylibrary/mylibrary.component';
import { BreadcrumbComponent } from './breadcrumb/breadcrumb.component';
import { BpmcontrolComponent } from './bpmcontrol/bpmcontrol.component';
import { DatePipe } from '@angular/common';
import { GalleryvideoComponent } from './galleryvideo/galleryvideo.component';
import { VideoplayerComponent } from './videoplayer/videoplayer.component';
import { NotfoundComponent } from './notfound/notfound.component';
import { PageloadingComponent } from './pageloading/pageloading.component';
import { ToastsComponent } from './toasts/toasts.component';
import { ErrorhandlerInterceptor } from './errorhandler.interceptor';
import { NgxStripeModule } from 'ngx-stripe';
import { environment } from 'src/environments/environment';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { BuilddisplaystatusComponent } from './builddisplaystatus/builddisplaystatus.component';
import { CollectionsearchComponent } from './collectionsearch/collectionsearch.component';

/**
 * Here we pass the configuration parameters to create an MSAL instance.
 * For more info, visit: https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/configuration.md
 */

 export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication(msalConfig);
}

/**
 * MSAL Angular will automatically retrieve tokens for resources 
 * added to protectedResourceMap. For more info, visit: 
 * https://github.com/AzureAD/microsoft-authentication-library-for-js/blob/dev/lib/msal-angular/docs/v2-docs/initialization.md#get-tokens-for-web-api-calls
 */
export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  protectedResourceMap.set(protectedResources.tagsApi.endpoint, protectedResources.tagsApi.scopes);
  protectedResourceMap.set(protectedResources.layerUploadApi.endpoint, protectedResources.layerUploadApi.scopes);
  protectedResourceMap.set(protectedResources.userCollectionApi.endpoint, protectedResources.userCollectionApi.scopes);
  protectedResourceMap.set(protectedResources.clipApi.endpoint, protectedResources.clipApi.scopes);
  protectedResourceMap.set(protectedResources.videoApi.endpoint, protectedResources.videoApi.scopes);

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap
  };
}

/**
 * Set your default interaction type for MSALGuard here. If you have any
 * additional scopes you want the user to consent upon login, add them here as well.
 */
export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return { 
    interactionType: InteractionType.Redirect,
    authRequest: loginRequest
  };
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ContentBrowserComponent,
    LayerUploadComponent,
    LayertypecontrolComponent,
    GalleryplayerComponent,
    ClipBuilderComponent,
    MusicVideoBuilderComponent,
    MyLibraryComponent,
    BreadcrumbComponent,
    BpmcontrolComponent,
    GalleryvideoComponent,
    VideoplayerComponent,
    NotfoundComponent,
    PageloadingComponent,
    ToastsComponent,
    ConfirmationComponent,
    BuilddisplaystatusComponent,
    CollectionsearchComponent
  ],
  imports: [
    BrowserModule,
    NgxStripeModule.forRoot(environment.stripePublishableKey),
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    MsalModule
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorhandlerInterceptor,
      multi: true
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory
    },
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    DatePipe
  ],
  bootstrap: [AppComponent, MsalRedirectComponent]
})
export class AppModule { }
