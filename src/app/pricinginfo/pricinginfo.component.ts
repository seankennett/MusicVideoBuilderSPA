import { Component } from '@angular/core';
import { PricingService } from '../pricing.service';
import { Resolution } from '../resolution';
import { License } from '../license';

@Component({
  selector: 'app-pricinginfo',
  templateUrl: './pricinginfo.component.html',
  styleUrls: ['./pricinginfo.component.scss']
})
export class PricinginfoComponent {
  constructor(public pricingService: PricingService) { }
  resolutionList = [Resolution.Free, Resolution.Hd, Resolution.FourK]
  licenseList = [License.Personal, License.Standard, License.Enhanced]

  Resolution = Resolution
  License = License

  displayResolution = (resolution: Resolution) =>{
    switch (resolution) {
      case Resolution.Hd:
        return 'HD'
      case Resolution.FourK:
        return '4K'
      case Resolution.Free:
        return 'Free'
    }
  }
}
