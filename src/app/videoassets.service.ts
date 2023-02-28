import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { errorBody } from './errorhandler.interceptor';
import { Videoasset } from './videoasset';
import { Videobuildrequest } from './videobuildrequest';

@Injectable({
  providedIn: 'root'
})
export class VideoassetsService {
  baseurl = environment.apiEndpoint + '/Videos';

  constructor(private http: HttpClient) { }  

  create(videoId: number, videoBuildRequest: Videobuildrequest) {
    return this.http.post<Videoasset>(this.baseurl + '/' + videoId + '/Assets', videoBuildRequest, {context: errorBody("Problem setting up video build.")})
  }

  createAudioBlobUri(videoId: number, videoBuildRequest: Videobuildrequest) {
    return this.http.post<string>(this.baseurl + '/' + videoId + '/Assets/CreateAudioBlobUri', videoBuildRequest, {context: errorBody("Problem uploading audio file.")})
  } 
}
