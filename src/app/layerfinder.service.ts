import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { LayerFinder } from './layerfinder';

@Injectable({
  providedIn: 'root'
})
export class LayerFinderService {

  url = protectedResources.layerFinderApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<LayerFinder[]>(this.url, {context: errorBody('Unable to get layers from server. Please refresh to try again.')});
  }
}
