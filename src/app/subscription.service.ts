import { Injectable } from '@angular/core';
import { protectedResources } from './auth-config';
import { HttpClient } from '@angular/common/http';
import { errorBody } from './errorhandler.interceptor';
import { Subscriptionproduct } from './subscriptionproduct';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {

  publicUrl = protectedResources.subscriptionPublicApi.endpoint
  privateUrl = protectedResources.subscriptionPrivateApi.endpoint

  constructor(private http: HttpClient) { }

  getAll() {
    return this.http.get<Subscriptionproduct[]>(this.publicUrl, {context: errorBody('Unable to get subscriptions from server. Please refresh to try again.')});
  }

  checkout(priceId:string){
    return this.http.post<string>(this.privateUrl + '/Checkout', { priceId: priceId }, { context: errorBody("Problem creating checkout.")});
  }

  getBillingPortalSessionUrl() {
    return this.http.get<string>(this.privateUrl + '/BillingPortalSessionUrl', { context: errorBody("Problem getting session.")});
  }

  get(isActive: boolean){
    return this.http.get<Subscriptionproduct | null>(this.privateUrl + '?isActive=' + isActive, { context: errorBody("Unable to get user subscription from server. Please refresh to try again.")});
  }

  getSession(sessionId:string){
    return this.http.get<string | null>(this.privateUrl + '/CheckoutSession?sessionId=' + sessionId, { context: errorBody("Problem getting session.")}); 
  }
}
