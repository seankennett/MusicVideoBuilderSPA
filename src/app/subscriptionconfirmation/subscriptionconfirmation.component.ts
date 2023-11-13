import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StripeService } from 'ngx-stripe';
import { SubscriptionService } from '../subscription.service';

@Component({
  selector: 'app-subscriptionconfirmation',
  templateUrl: './subscriptionconfirmation.component.html',
  styleUrls: ['./subscriptionconfirmation.component.scss']
})
export class SubscriptionconfirmationComponent implements OnInit {

  constructor(private route: ActivatedRoute, private subscirptionService: SubscriptionService, private stripeService: StripeService) { }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      var sessionId = params['session_id'];
      if (sessionId) {
        this.subscirptionService.getSession(sessionId).subscribe((clientSecret) => {
          if (clientSecret) {
            this.stripeService.getInstance()?.initEmbeddedCheckout({ clientSecret }).then((checkout) => {
              checkout.mount('#checkout');
              this.successResponse = false;
              this.pageLoading = false;
            });
          } else {
            this.pageLoading = false;
          }
        })
      }
    });
  }

  pageLoading = true;
  successResponse = true;
}
