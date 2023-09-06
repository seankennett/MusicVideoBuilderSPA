import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { Collection } from './collection';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {

  url = protectedResources.collectionApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Collection[]>(this.url, {context: errorBody('Unable to get layers from server. Please refresh to try again.')});
  }
}
