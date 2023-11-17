import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LicensemodalComponent } from './licensemodal.component';

describe('LicensemodalComponent', () => {
  let component: LicensemodalComponent;
  let fixture: ComponentFixture<LicensemodalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [LicensemodalComponent]
    });
    fixture = TestBed.createComponent(LicensemodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
