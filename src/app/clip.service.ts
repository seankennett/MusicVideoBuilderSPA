import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Clip } from './clip';
import { errorBody } from './errorhandler.interceptor';

const ClipsKey = 'clips'
@Injectable({
  providedIn: 'root'
})
export class ClipService {

  constructor(private http: HttpClient) { }

  post(clip : Clip) {
    var clips = this.getAll();
    var dbClipIndex = clips.findIndex(x => x.clipId === clip.clipId);
    if (dbClipIndex !== -1){
      clips.splice(dbClipIndex, 1);
    } else {
      clip.clipId = clips.length + 1;
    }

    clips.push(clip);
    
    localStorage.setItem(ClipsKey, JSON.stringify(clips));

    return clip;
  }

  getAll(){
    var clipsString = localStorage.getItem(ClipsKey);
    if (clipsString){
      return JSON.parse(clipsString) as Clip[];
    }
    return [];
  }

  delete(clipId: number) {
    var clips = this.getAll();
    var dbClipIndex = clips.findIndex(x => x.clipId === clipId);
    if (dbClipIndex !== -1){
      clips.splice(dbClipIndex, 1);
    }

    localStorage.setItem(ClipsKey, JSON.stringify(clips));
  }
}
