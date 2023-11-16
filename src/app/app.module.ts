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
import { DisplayComponent } from './display/display.component';
import { ColourpickerComponent } from './colourpicker/colourpicker.component';
import { ConfirmationmodalComponent } from './confirmationmodal/confirmationmodal.component';
import { AudiomodalComponent } from './audiomodal/audiomodal.component';
import { ClipinfoComponent } from './clipinfo/clipinfo.component';
import { TransitioninfoComponent } from './transitioninfo/transitioninfo.component';
import { HelpComponent } from './help/help.component';
import { SubscriptionsComponent } from './subscriptions/subscriptions.component';
import { SubscriptionconfirmationComponent } from './subscriptionconfirmation/subscriptionconfirmation.component';
import { BuildassettableComponent } from './buildassettable/buildassettable.component';
import { CostlistComponent } from './costlist/costlist.component';

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

  protectedResourceMap.set(protectedResources.userCollectionApi.endpoint, protectedResources.userCollectionApi.scopes);
  protectedResourceMap.set(protectedResources.clipApi.endpoint, protectedResources.clipApi.scopes);
  protectedResourceMap.set(protectedResources.videoApi.endpoint, protectedResources.videoApi.scopes);
  protectedResourceMap.set(protectedResources.subscriptionPrivateApi.endpoint, protectedResources.subscriptionPrivateApi.scopes);

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
    CollectionsearchComponent,
    DisplayComponent,
    ColourpickerComponent,
    ConfirmationmodalComponent,
    AudiomodalComponent,
    ClipinfoComponent,
    TransitioninfoComponent,
    HelpComponent,
    SubscriptionsComponent,
    SubscriptionconfirmationComponent,
    BuildassettableComponent,
    CostlistComponent
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
