import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { Clip } from './clip';

@Injectable({
  providedIn: 'root'
})
export class ClipService {

  url = protectedResources.clipApi.endpoint

  constructor(private http: HttpClient) { }

  post(clip : Clip) {
    return this.http.post<Clip>(this.url, clip);
  }

  getAll(){
    return this.http.get<Clip[]>(this.url);
  }
}
