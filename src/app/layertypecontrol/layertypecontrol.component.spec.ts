import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayertypecontrolComponent } from './layertypecontrol.component';

describe('LayertypecontrolComponent', () => {
  let component: LayertypecontrolComponent;
  let fixture: ComponentFixture<LayertypecontrolComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayertypecontrolComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayertypecontrolComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
