import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Collection } from '../collection';
import { License } from '../license';
import { Resolution } from '../resolution';
import { UserCollection } from '../usercollection';
import { Subscriptionproduct } from '../subscriptionproduct';
import { Subscriptionproducts } from '../subscriptionproducts';
import { PricingService } from '../pricing.service';

@Component({
  selector: 'app-costlist',
  templateUrl: './costlist.component.html',
  styleUrls: ['./costlist.component.scss']
})
export class CostlistComponent implements OnChanges {

  constructor(private pricingService: PricingService){}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['license'] && changes['license'].currentValue !== changes['license'].previousValue ||
      changes['resolution'] && changes['resolution'].currentValue !== changes['resolution'].previousValue) {
      this.calculateTotal();
    }

    if (changes['collections'] && changes['collections'].currentValue && changes['collections'].previousValue){
      var currentIds = (<Collection[]>changes['collections'].currentValue).map(x => x.collectionId);
      var previousIds = (<Collection[]>changes['collections'].previousValue).map(x => x.collectionId);
      var differenceIds = currentIds.filter(x => !previousIds.includes(x)).concat(previousIds.filter(x => !currentIds.includes(x)));
      if (differenceIds.length !== 0){
        this.calculateTotal();
      }
    }
  }

  total = 0;
  calculateTotal = () => {
    var licensedUserCollections = this.userCollections.filter(u => u.resolution == this.resolution && u.license == this.license)
    this.licensedCollections = this.collections.filter(v => licensedUserCollections.some(l => l.collectionId === v.collectionId))
    this.unlicensedCollections = this.collections.filter(v => !licensedUserCollections.some(l => l.collectionId === v.collectionId));

    this.buildCost = this.pricingService.pricePerBuild(this.resolution);
    this.buildTotal = this.pricingService.buildTotal(this.resolution, this.subscriptionProduct);

    this.collectionLicenseCost = this.pricingService.pricePerCollection(this.license, this.resolution);

    this.licensesTotal = this.pricingService.licensesTotal(this.license, this.resolution, this.unlicensedCollections.length, this.subscriptionProduct);    

    this.total = this.pricingService.total(this.license, this.resolution, this.unlicensedCollections.length, this.subscriptionProduct);
    this.totalEvent.emit(this.total);
  }

  @Input() collections!: Collection[];
  @Input() userCollections!: UserCollection[];
  @Input() license!: License;
  @Input() resolution!: Resolution;
  @Input() subscriptionProduct!: Subscriptionproduct | null;

  @Output() totalEvent = new EventEmitter<number>();

  License = License;
  Resolution = Resolution
  resolutionList = [{
    displayName: 'Free (384x216)',
    resolution: Resolution.Free
  }, {
    displayName: 'HD (1920x1080)',
    resolution: Resolution.Hd
  }, {
    displayName: '4K (3840x2160)',
    resolution: Resolution.FourK
  }];

  licensedCollections: Collection[] = [];
  unlicensedCollections: Collection[] = [];
  buildCost = 0;
  buildTotal = 0;
  collectionLicenseCost = 0;
  licensesTotal = 0;

  hasLicense = (collection:Collection) =>{
    return this.licensedCollections.some(l => l.collectionId === collection.collectionId);
  }

  get hasLicenseSubscription() {
    return this.subscriptionProduct
    && (this.subscriptionProduct.productId === Subscriptionproducts.License || this.subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)
  }

  get hasBuilderSubscription() {
    return this.subscriptionProduct
    && (this.subscriptionProduct.productId === Subscriptionproducts.Builder || this.subscriptionProduct.productId === Subscriptionproducts.LicenseBuilder)
  }

  displayResolution = (resolution: Resolution) => {
    return this.resolutionList.find(r => r.resolution === resolution)?.displayName
  }
}
