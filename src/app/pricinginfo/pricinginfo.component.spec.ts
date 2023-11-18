import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PricinginfoComponent } from './pricinginfo.component';

describe('PricinginfoComponent', () => {
  let component: PricinginfoComponent;
  let fixture: ComponentFixture<PricinginfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PricinginfoComponent]
    });
    fixture = TestBed.createComponent(PricinginfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
