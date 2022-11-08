import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { Clip } from './clip';
import { errorBody } from './errorhandler.interceptor';

@Injectable({
  providedIn: 'root'
})
export class ClipService {

  url = protectedResources.clipApi.endpoint

  constructor(private http: HttpClient) { }

  post(clip : Clip) {
    return this.http.post<Clip>(this.url, clip, {context: errorBody("Unable to save clip to server. Please try again.")});
  }

  getAll(){
    return this.http.get<Clip[]>(this.url, {context: errorBody("Unable to get user's clips from server. Please refresh to try again.")});
  }

  delete(clipId: number) {
    return this.http.delete(this.url + '/' + clipId, {context: errorBody("Unable to remove clip from server. Please try again.")});
  }
}
