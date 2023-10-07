import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { UserCollection } from './usercollection';

@Injectable({
  providedIn: 'root'
})
export class UserCollectionService {
  url = protectedResources.userCollectionApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<UserCollection[]>(this.url, {context: errorBody("Unable to get layers from server. Please refresh to try again.")});
  }
}
