import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ResolutioninfoComponent } from './resolutioninfo.component';

describe('ResolutioninfoComponent', () => {
  let component: ResolutioninfoComponent;
  let fixture: ComponentFixture<ResolutioninfoComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ResolutioninfoComponent]
    });
    fixture = TestBed.createComponent(ResolutioninfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
