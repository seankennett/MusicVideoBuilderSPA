import { Component } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-pricingmodal',
  templateUrl: './pricingmodal.component.html',
  styleUrls: ['./pricingmodal.component.scss']
})
export class PricingmodalComponent {
  constructor(public activeModal: NgbActiveModal) { }
}
