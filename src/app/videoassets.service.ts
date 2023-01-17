import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { errorBody } from './errorhandler.interceptor';
import { Userlayerstatus } from './userlayerstatus';
import { Video } from './video';
import { VideoAssets } from './videoassets';

@Injectable({
  providedIn: 'root'
})
export class VideoassetsService {

  baseurl = environment.apiEndpoint + '/Videos';

  constructor(private http: HttpClient) { }

  create(videoId: number, buildRequest: { audioBlobUrl: string | undefined; resolution: Userlayerstatus }) {
    return this.http.post<Video>(this.baseurl + '/' + videoId + '/Assets', buildRequest, {context: errorBody("Problem setting up video build.")})
  }

  createAudioBlobUri(videoId: number, audioBlobCreation: { resolution: Userlayerstatus }) {
    return this.http.post<string>(this.baseurl + '/' + videoId + '/Assets/CreateAudioBlobUri', audioBlobCreation, {context: errorBody("Problem uploading audio file.")})
  } 
}
