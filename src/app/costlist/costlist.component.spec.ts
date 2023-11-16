import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CostlistComponent } from './costlist.component';

describe('CostlistComponent', () => {
  let component: CostlistComponent;
  let fixture: ComponentFixture<CostlistComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CostlistComponent]
    });
    fixture = TestBed.createComponent(CostlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
