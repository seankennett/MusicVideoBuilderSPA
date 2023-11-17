import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TandcmodalComponent } from './tandcmodal.component';

describe('TandcmodalComponent', () => {
  let component: TandcmodalComponent;
  let fixture: ComponentFixture<TandcmodalComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [TandcmodalComponent]
    });
    fixture = TestBed.createComponent(TandcmodalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
