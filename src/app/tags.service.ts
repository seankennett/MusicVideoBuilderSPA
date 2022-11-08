import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { protectedResources } from './auth-config';
import { Tag } from './tag';
import { errorBody } from './errorhandler.interceptor';

@Injectable({
  providedIn: 'root'
})
export class TagsService {

  url = protectedResources.tagsApi.endpoint

  constructor(private http: HttpClient) { }

  getTags() { 
    return this.http.get<Tag[]>(this.url, {context: errorBody("Unable to get tags from server. Please refresh to try again.")});
  }
}
