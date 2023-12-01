import { Component, OnInit } from '@angular/core';
import { SubscriptionService } from '../subscription.service';
import { Subscriptionproduct } from '../subscriptionproduct';
import { catchError, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StripeService } from 'ngx-stripe';
import { StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { ToastService } from '../toast.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-subscriptions',
  templateUrl: './subscriptions.component.html',
  styleUrls: ['./subscriptions.component.scss']
})
export class SubscriptionsComponent implements OnInit {

  constructor(private subscriptionService: SubscriptionService, private stripeService: StripeService, private toastService: ToastService, private router: Router) { }

  subscriptionProducts: Subscriptionproduct[] = [];
  existingSubscriptionProduct: Subscriptionproduct | null = null;
  pageLoading = true;
  isWaitingForResponse = false;
  activeTabId = 1;

  ngOnInit(): void {
    this.subscriptionService.getAll().subscribe((subscriptionProducts: Subscriptionproduct[]) => {
      this.subscriptionService.get(false).subscribe((subscriptionProduct: Subscriptionproduct | null) => {
        this.subscriptionProducts = subscriptionProducts
        this.existingSubscriptionProduct = subscriptionProduct;
        this.pageLoading = false;
      });
    });
  }

  checkoutElement: StripeEmbeddedCheckout | undefined
  checkout = (subscriptionProduct: Subscriptionproduct) => {
    this.isWaitingForResponse = true;
    this.subscriptionService.checkout(subscriptionProduct.priceId).pipe(catchError((error: HttpErrorResponse) => {
      this.isWaitingForResponse = false;
      return throwError(() => new Error());
    })).subscribe(clientSecret => {
      this.stripeService.getInstance()?.initEmbeddedCheckout({ clientSecret }).then((checkout) => {
        // this.checkoutElement = checkout;
        // checkout.mount('#checkout');
        this.isWaitingForResponse = false;
        this.activeTabId = 2;
      });
    })
  }

  tabChange = () => {
    if (this.checkoutElement) {
      this.checkoutElement.destroy();
    }

    if (this.activeTabId === 1) {
      this.isWaitingForResponse = true;
      this.subscriptionService.get(false).pipe(catchError((error: HttpErrorResponse) => {
        this.isWaitingForResponse = false;
        return throwError(() => new Error());
      })).subscribe((subscriptionProduct: Subscriptionproduct | null) => {
        this.existingSubscriptionProduct = subscriptionProduct;
        this.isWaitingForResponse = false;
      });
    }
  }

  manageSubscription = () => {
    this.isWaitingForResponse = true;
    this.subscriptionService.getBillingPortalSessionUrl().pipe(catchError((error: HttpErrorResponse) => {
      this.isWaitingForResponse = false;
      return throwError(() => new Error());
    })).subscribe(sessionUrl => {
      window.location.href = sessionUrl;
    })
  }

}
