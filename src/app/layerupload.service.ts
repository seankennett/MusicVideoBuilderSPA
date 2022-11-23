import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { errorBody } from './errorhandler.interceptor';
import { Layerupload } from './layerupload';

@Injectable({
  providedIn: 'root'
})
export class LayerUploadService {
  
  url = protectedResources.layerUploadApi.endpoint

  constructor(private http: HttpClient) { }

  createContainer(layerUpload: Layerupload) {
    return this.http.post<{blobSasUrl:string, layerId: string}>(this.url + '/CreateContainer', layerUpload, {context: errorBody("Unable to create storage container. Please try again.")});
  }

  post(layerUpload: Layerupload) {
    return this.http.post(this.url, layerUpload, {context: errorBody("Unable to queue image processing. Please try again.")});
  }
}
