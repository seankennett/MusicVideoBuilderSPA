import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { Layer } from './layer';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  url = protectedResources.layerApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Layer[]>(this.url);
  }
}
