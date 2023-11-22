import { Injectable } from '@angular/core';
import { License } from './license';
import { Resolution } from './resolution';
import { Subscriptionproduct } from './subscriptionproduct';
import { Subscriptionproducts } from './subscriptionproducts';

@Injectable({
  providedIn: 'root'
})
export class PricingService {

  constructor() { }

  pricePerCollection = (license: License, resolution: Resolution) =>{
    var collectionResolutionCost = 0;
    switch (resolution) {
      case Resolution.Hd:
        collectionResolutionCost = 25;
        break;
      case Resolution.FourK:
        collectionResolutionCost = 50;
        break;
    }

    return collectionResolutionCost * this.licenseFactor(license);
  }

  private licenseFactor = (license: License) => {
    switch (license) {
      case License.Standard:
        return 1;
      case License.Enhanced:
        return 3;
      default:
        return 0;
    }
  }

  pricePerBuild = (resolution: Resolution) =>{
    switch (resolution) {
      case Resolution.Free:
        return 0;
      case Resolution.Hd:
        return 5;
      case Resolution.FourK:
        return 10;
    }
  }

  buildTotal = (resolution: Resolution, subscriptionProduct: Subscriptionproduct | null) =>{
    if (subscriptionProduct && (subscriptionProduct.productId === Subscriptionproducts.Builder || subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)){
      return 0;
    }

    return this.pricePerBuild(resolution);
  }

  licensesTotal = (license: License, resolution: Resolution, numberOfCollections: number, subscriptionProduct: Subscriptionproduct | null) => {
    if (subscriptionProduct && (subscriptionProduct.productId === Subscriptionproducts.License || subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)){
      return 0;
    }

    return this.pricePerCollection(license, resolution) * numberOfCollections;
  }

  total = (license: License, resolution: Resolution, numberOfCollections: number, subscirptionProduct: Subscriptionproduct | null) =>{
    if (resolution === Resolution.Free) {
      return 0;
    }

    return this.buildTotal(resolution, subscirptionProduct) + this.licensesTotal(license, resolution, numberOfCollections, subscirptionProduct);
  }
}
