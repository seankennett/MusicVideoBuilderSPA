import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptionconfirmationComponent } from './subscriptionconfirmation.component';

describe('SubscriptionconfirmationComponent', () => {
  let component: SubscriptionconfirmationComponent;
  let fixture: ComponentFixture<SubscriptionconfirmationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SubscriptionconfirmationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SubscriptionconfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
