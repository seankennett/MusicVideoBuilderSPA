import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolutionmodalComponent } from './resolutionmodal.component';

describe('ResolutionmodalComponent', () => {
  let component: ResolutionmodalComponent;
  let fixture: ComponentFixture<ResolutionmodalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResolutionmodalComponent]
    });
    fixture = TestBed.createComponent(ResolutionmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
