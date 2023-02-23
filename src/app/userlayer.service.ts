import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { UserLayer } from './userlayer';

@Injectable({
  providedIn: 'root'
})
export class UserlayerService {
  url = protectedResources.userLayerApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<UserLayer[]>(this.url, {context: errorBody("Unable to get layers from server. Please refresh to try again.")});
  }
}
