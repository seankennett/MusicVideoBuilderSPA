import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitioninfoComponent } from './transitioninfo.component';

describe('TransitioninfoComponent', () => {
  let component: TransitioninfoComponent;
  let fixture: ComponentFixture<TransitioninfoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ TransitioninfoComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TransitioninfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
