import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { UserLayer } from './userlayer';

@Injectable({
  providedIn: 'root'
})
export class UserlayerService {

  url = protectedResources.userLayerApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<UserLayer[]>(this.url);
  }

  postUserLayer(userLayer: UserLayer){
    return this.http.post<UserLayer>(this.url, userLayer);
  }
}
