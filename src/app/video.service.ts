import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { errorBody } from './errorhandler.interceptor';
import { Video } from './video';

const VideosKey = 'Videos'

@Injectable({
  providedIn: 'root'
})
export class VideoService {
  url = environment.apiEndpoint + '/Videos'

  constructor(private http: HttpClient) { }

  post(video : Video) {
    var videos = this.getAll();
    var dbClipIndex = videos.findIndex(x => x.videoId === video.videoId);
    if (dbClipIndex !== -1){
      videos.splice(dbClipIndex, 1);
    } else {
      video.videoId = videos.length + 1;
    }

    videos.push(video);
    
    localStorage.setItem(VideosKey, JSON.stringify(videos));

    return video;
  }

  getAll(){
    var videoString = localStorage.getItem(VideosKey);
    if (videoString){
      return JSON.parse(videoString) as Video[];
    }

    return [];
  }

  delete(videoId: number) {
    var videos = this.getAll();
    var dbClipIndex = videos.findIndex(x => x.videoId === videoId);
    if (dbClipIndex !== -1){
      videos.splice(dbClipIndex, 1);
    }

    localStorage.setItem(VideosKey, JSON.stringify(videos));
  }
}