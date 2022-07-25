import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BpmcontrolComponent } from './bpmcontrol.component';

describe('BpmcontrolComponent', () => {
  let component: BpmcontrolComponent;
  let fixture: ComponentFixture<BpmcontrolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BpmcontrolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BpmcontrolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
