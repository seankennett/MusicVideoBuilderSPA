import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { protectedResources } from './auth-config';
import { Video } from './video';

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  url = environment.apiEndpoint + '/Videos'

  constructor(private http: HttpClient) { }

  post(video : Video) {
    return this.http.post<Video>(this.url, video);
  }

  getAll(){
    return this.http.get<Video[]>(this.url);
  }

  delete(videoId: number) {
    return this.http.delete(this.url + '/' + videoId);
  }
}