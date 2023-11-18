import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../subscription.service';
import { Subscriptionproduct } from '../subscriptionproduct';

@Component({
  selector: 'app-help',
  templateUrl: './help.component.html',
  styleUrls: ['./help.component.scss']
})
export class HelpComponent implements OnInit {

  constructor(private subscriptionService: SubscriptionService) { }

  pageLoading = true;
  subscriptionProducts: Subscriptionproduct[] = [];

  ngOnInit(): void {
    this.subscriptionService.getAll().subscribe((subscriptionProducts: Subscriptionproduct[]) =>{
      this.subscriptionProducts = subscriptionProducts;
      this.pageLoading = false;
    });
  }
}
