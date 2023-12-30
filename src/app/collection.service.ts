import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { errorBody } from './errorhandler.interceptor';
import { Collection } from './collection';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CollectionService {

  url = environment.publicApiEndpoint + "/Collections"

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Collection[]>(this.url, {context: errorBody('Unable to get collections from server. Please refresh to try again.')});
  }
}
