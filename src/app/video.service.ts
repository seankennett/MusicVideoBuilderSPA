import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { Video } from './video';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  url = environment.apiEndpoint + '/Videos'

  constructor(private http: HttpClient) { }

  post(video : Video) {
    return this.http.post<Video>(this.url, video, {context: errorBody("Unable to save video to server. Please try again.")});
  }

  getAll(){
    return this.http.get<Video[]>(this.url, {context: errorBody("Unable to get user's videos from server. Please refresh to try again.")});
  }

  delete(videoId: number) {
    return this.http.delete(this.url + '/' + videoId, {context: errorBody("Unable to delete video from server. Please try again.")});
  }
}