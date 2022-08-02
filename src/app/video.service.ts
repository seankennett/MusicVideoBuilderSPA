import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { Video } from './video';

@Injectable({
  providedIn: 'root'
})
export class VideoService {

  url = protectedResources.videoApi.endpoint

  constructor(private http: HttpClient) { }

  post(video : Video) {
    return this.http.post<Video>(this.url, video);
  }

  getAll(){
    return this.http.get<Video[]>(this.url);
  }
}