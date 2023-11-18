import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Subscriptionproduct } from '../subscriptionproduct';

@Component({
  selector: 'app-subscriptioninfo',
  templateUrl: './subscriptioninfo.component.html',
  styleUrls: ['./subscriptioninfo.component.scss']
})
export class SubscriptioninfoComponent {

  @Input() showCheckout = true;
  @Input() isWaitingForResponse = false;
  @Input() subscriptionProducts: Subscriptionproduct[] = [];

  @Output() checkoutEvent = new EventEmitter<Subscriptionproduct>();

  checkout = (subscriptionProduct: Subscriptionproduct) =>{
    this.checkoutEvent.emit(subscriptionProduct);
  }
}
