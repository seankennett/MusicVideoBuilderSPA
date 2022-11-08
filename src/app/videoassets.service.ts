import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
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
}
