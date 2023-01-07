import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { errorBody } from './errorhandler.interceptor';
import { Resolutions } from './resolutions';
import { Video } from './video';
import { VideoAssets } from './videoassets';

@Injectable({
  providedIn: 'root'
})
export class VideoassetsService {

  baseurl = environment.apiEndpoint + '/Videos';

  constructor(private http: HttpClient) { }

  get(videoId: number, free: boolean, audioFileName: string | undefined, includeCodeFiles: boolean, includeImageFiles: boolean) {
    return this.http.get<VideoAssets>(this.baseurl + '/' + videoId + '/Assets?free=' + free + '&audioFileName=' + (audioFileName ?? '') + '&includeCodes=' + includeCodeFiles + '&includeImages=' + includeImageFiles
    , {context: errorBody("Unable to get video assets from server. Please try again.")} );
  }

  create(videoId: number, audioBlob: { password: string; audioBlobUrl: string | undefined; resolution: Resolutions }) {
    return this.http.post<Video>(this.baseurl + '/' + videoId + '/Assets', audioBlob, {context: errorBody("Password incorrect or failed to create task.")})
  }

  createAudioBlobUri(videoId: number, audioBlobCreation: { password: string; resolution: Resolutions }) {
    return this.http.post<string>(this.baseurl + '/' + videoId + '/Assets/CreateAudioBlobUri', audioBlobCreation, {context: errorBody("Problem uploading audio file.")})
  } 
}
