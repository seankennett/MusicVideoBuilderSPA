import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';

@Injectable({
  providedIn: 'root'
})
export class LayerService {

  url = protectedResources.layerUploadApi.endpoint

  constructor(private http: HttpClient) { }

  upload(formData: FormData) {
    return this.http.post(this.url, formData, {
      reportProgress: true,
      observe: 'events',
      responseType: 'text'
    });
  }
}
