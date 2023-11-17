import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricingmodalComponent } from './pricingmodal.component';

describe('PricingmodalComponent', () => {
  let component: PricingmodalComponent;
  let fixture: ComponentFixture<PricingmodalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PricingmodalComponent]
    });
    fixture = TestBed.createComponent(PricingmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
