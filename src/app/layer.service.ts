import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { LayerFinder } from './layerfinder';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  url = protectedResources.layerApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<LayerFinder[]>(this.url);
  }
}
