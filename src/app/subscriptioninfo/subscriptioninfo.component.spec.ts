import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubscriptioninfoComponent } from './subscriptioninfo.component';

describe('SubscriptioninfoComponent', () => {
  let component: SubscriptioninfoComponent;
  let fixture: ComponentFixture<SubscriptioninfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [SubscriptioninfoComponent]
    });
    fixture = TestBed.createComponent(SubscriptioninfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
