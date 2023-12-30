import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';

import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';

import { ContentBrowserComponent } from './contentbrowser/contentbrowser.component';
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
import { environment } from 'src/environments/environment';
import { ConfirmationComponent } from './confirmation/confirmation.component';
import { CollectionsearchComponent } from './collectionsearch/collectionsearch.component';
import { DisplayComponent } from './display/display.component';
import { ColourpickerComponent } from './colourpicker/colourpicker.component';
import { ConfirmationmodalComponent } from './confirmationmodal/confirmationmodal.component';
import { AudiomodalComponent } from './audiomodal/audiomodal.component';
import { ClipinfoComponent } from './clipinfo/clipinfo.component';
import { TransitioninfoComponent } from './transitioninfo/transitioninfo.component';
import { HelpComponent } from './help/help.component';
import { ResolutionmodalComponent } from './resolutionmodal/resolutionmodal.component';
import { ResolutioninfoComponent } from './resolutioninfo/resolutioninfo.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    ContentBrowserComponent,
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
    CollectionsearchComponent,
    DisplayComponent,
    ColourpickerComponent,
    ConfirmationmodalComponent,
    AudiomodalComponent,
    ClipinfoComponent,
    TransitioninfoComponent,
    HelpComponent,
    ResolutionmodalComponent,
    ResolutioninfoComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    NgbModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
  ],
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorhandlerInterceptor,
      multi: true
    },
    DatePipe
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
