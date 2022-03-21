import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LayeruploadComponent } from './layerupload.component';

describe('LayeruploadComponent', () => {
  let component: LayeruploadComponent;
  let fixture: ComponentFixture<LayeruploadComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ LayeruploadComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LayeruploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
