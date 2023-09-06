import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { UserDisplayLayer } from './userdisplaylayer';

@Injectable({
  providedIn: 'root'
})
export class UserdisplaylayerService {
  url = protectedResources.userDisplayLayerApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<UserDisplayLayer[]>(this.url, {context: errorBody("Unable to get layers from server. Please refresh to try again.")});
  }
}
