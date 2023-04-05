import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Videobuildrequest } from './videobuildrequest';
import { Buildasset } from './buildasset';
import { Paymentintentrequest } from './paymentintentrequest';
import { errorBody } from './errorhandler.interceptor';

@Injectable({
  providedIn: 'root'
})
export class BuildsService {
  
  baseurl = environment.apiEndpoint + '/Videos';

  constructor(private http: HttpClient) { }  

  create(videoId: number, videoBuildRequest: Videobuildrequest) {
    return this.http.post(this.baseurl + '/' + videoId + '/Builds', videoBuildRequest, {context: errorBody("Problem setting up video build.")})
  }

  createAudioBlobUri(videoId: number, videoBuildRequest: Videobuildrequest) {
    return this.http.post<string>(this.baseurl + '/' + videoId + '/Builds/CreateAudioBlobUri', videoBuildRequest, {context: errorBody("Problem uploading audio file.")})
  }

  validateAudioBlob(videoId: number, videoBuildRequest: Videobuildrequest) {
    return this.http.post(this.baseurl + '/' + videoId + '/Builds/ValidateAudioBlob', videoBuildRequest, {context: errorBody("Audio validation failed.")})
  }
  
  checkout(videoId: number, paymentIntentRequest: Paymentintentrequest){
    return this.http.post<string>(this.baseurl + '/' + videoId + '/Builds/Checkout', paymentIntentRequest, { context: errorBody("Problem creating checkout.")})
  }

  getAll() {
    return this.http.get<Buildasset[]>(this.baseurl + '/Builds', {context: errorBody("Unable to get user's video assets from server. Please refresh to try again.")})
  }

}
